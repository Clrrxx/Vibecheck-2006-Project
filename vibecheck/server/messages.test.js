import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessage, registerMessageRoutes } from './messages.js';
import { connectionKey } from './connections.js';
const clientId = '11111111-1111-4111-8111-111111111111';
const friend = { from: 'a', to: 'b', fromName: 'Alice', toName: 'Bob', status: 'accepted' };
const pair = connectionKey('a', 'b');

test('message validation rejects whitespace, non-text, oversized messages and unsafe retry IDs', () => {
  assert.equal(validateMessage({ text: 'Hello', clientId }), null);
  for (const text of ['', '   ', null, 2, 'x'.repeat(2001)]) assert.ok(validateMessage({ text, clientId }));
  assert.ok(validateMessage({ text: 'hello', clientId: '../injection' }));
});
function harness(initial) {
  const data = structuredClone(initial);
  let counter = 0;
  const read = path => path.split('/').reduce((value, key) => value?.[key], data) ?? null;
  const write = (path, value) => {
    const parts = path.split('/');
    let object = data;
    for (const key of parts.slice(0, -1)) object = object[key] ??= {};
    object[parts.at(-1)] = value;
  };
  const db = { ref(path) {
    let before, limit;
    return {
      orderByKey() { return this; }, endBefore(key) { before = key; return this; }, limitToLast(count) { limit = count; return this; },
      child(key) { return db.ref(`${path}/${key}`); },
      push() { return { key: `-${String(++counter).padStart(19, '0')}` }; },
      async get() {
        let value = read(path);
        if (limit) value = Object.fromEntries(Object.entries(value || {}).filter(([key]) => !before || key < before).sort(([a], [b]) => a < b ? -1 : 1).slice(-limit));
        return { val: () => value };
      },
      async transaction(fn) { const value = fn(read(path)); write(path, value); return { snapshot: { val: () => value } }; },
      async set(value) { write(path, value); },
    };
  } };
  const routes = {};
  const auth = () => {};
  const app = Object.fromEntries(['get', 'post'].map(method => [method, (path, middleware, handler) => { assert.equal(middleware, auth); routes[method] = handler; }]));
  registerMessageRoutes(app, db, auth);
  return async (method, uid, other, body = {}, query = {}) => {
    const result = { status: 200 };
    const res = { set() {}, status(code) { result.status = code; return this; }, json(value) { result.body = value; return this; } };
    await routes[method]({ uid, params: { uid: other }, body, query }, res);
    return result;
  };
}
test('both friends share saved history, retries do not duplicate, and outsiders cannot read it', async () => {
  const call = harness({ gamerConnections: { [pair]: friend } });
  const sent = await call('post', 'a', 'b', { text: ' Hello Bob ', clientId });
  assert.equal(sent.status, 200);
  assert.equal(sent.body.message.sender, 'a');
  assert.equal(sent.body.message.text, 'Hello Bob');
  const repeated = await call('post', 'a', 'b', { text: ' Hello Bob ', clientId });
  assert.equal(repeated.body.message.id, sent.body.message.id);
  assert.equal((await call('get', 'b', 'a')).body.messages.length, 1);
  assert.equal((await call('get', 'b', 'a')).body.name, 'Alice');
  assert.equal((await call('get', 'c', 'a')).status, 403);
  assert.equal((await call('post', 'c', 'a', { text: 'Intruder', clientId })).status, 403);
  assert.equal((await call('post', 'a', 'b', { text: 'Changed content', clientId })).status, 409);
});
test('pending, declined, self and blocked conversations cannot be read or sent', async () => {
  for (const initial of [
    { gamerConnections: { [pair]: { ...friend, status: 'pending' } } },
    { gamerConnections: { [pair]: { ...friend, status: 'declined' } } },
    { gamerConnections: { [pair]: friend }, users: { a: { blockedGamers: { b: true } } } },
    { gamerConnections: { [pair]: friend }, users: { b: { blockedGamers: { a: true } } } },
  ]) {
    const call = harness(initial);
    assert.equal((await call('get', 'a', 'b')).status, 403);
    assert.equal((await call('post', 'a', 'b', { text: 'Hi', clientId })).status, 403);
  }
  const call = harness({});
  assert.equal((await call('get', 'a', 'a')).status, 403);
  assert.equal((await call('get', 'a', '../bad')).status, 403);
});
test('history uses key pagination without requiring Firebase indexes and returns 50 messages at a time', async () => {
  const messages = Object.fromEntries(Array.from({ length: 65 }, (_, index) => [`-${String(index).padStart(19, '0')}`, { sender: 'a', text: `${index}`, createdAt: index }]));
  const call = harness({ gamerConnections: { [pair]: friend }, gamerMessages: { [pair]: messages } });
  const latest = await call('get', 'a', 'b');
  assert.equal(latest.body.messages.length, 50);
  assert.equal(latest.body.messages[0].text, '15');
  assert.equal(latest.body.hasMore, true);
  const older = await call('get', 'a', 'b', {}, { before: latest.body.messages[0].id });
  assert.equal(older.body.messages.length, 15);
  assert.equal(older.body.hasMore, false);
  assert.equal((await call('get', 'a', 'b', {}, { before: '../bad' })).status, 400);
});
