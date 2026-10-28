import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionKey, validGamerId, newConnection, respondToConnection, registerConnectionRoutes, loadUserConnections } from './connections.js';

test('one canonical record prevents duplicate and simultaneous reverse requests', () => {
  assert.equal(connectionKey('a', 'b'), connectionKey('b', 'a'));
  assert.notEqual(connectionKey('a', 'bc'), connectionKey('ab', 'c'));
  const first = newConnection(null, 'a', 'b', 'Alice', 'Bob', 100);
  assert.equal(first.status, 'pending');
  assert.equal(newConnection(first, 'a', 'b', 'Alice', 'Bob', 101), undefined);
  assert.equal(newConnection(first, 'b', 'a', 'Bob', 'Alice', 101), undefined);
  const accepted = respondToConnection(first, 'b', 'accept', 102);
  assert.equal(newConnection(accepted, 'a', 'b', 'Alice', 'Bob', 103), undefined);
});
test('only recipient can accept or decline an unanswered request', () => {
  const pending = newConnection(null, 'a', 'b', 'Alice', 'Bob', 100);
  assert.equal(respondToConnection(pending, 'a', 'accept', 101), undefined);
  assert.equal(respondToConnection(pending, 'outsider', 'decline', 101), undefined);
  assert.equal(respondToConnection(pending, 'b', 'invalid', 101), undefined);
  const accepted = respondToConnection(pending, 'b', 'accept', 101);
  assert.equal(accepted.status, 'accepted');
  assert.equal(accepted.updatedAt, 101);
  assert.equal(respondToConnection(accepted, 'b', 'decline', 102), undefined);
  assert.equal(respondToConnection(pending, 'b', 'decline', 101).status, 'declined');
});
test('UID validation rejects database path injection', () => {
  for (const invalid of ['', '../users', 'a.b', 'a#b', 'a$b', 'a[b]', 'a\nb', null]) assert.equal(validGamerId(invalid), false);
  assert.equal(validGamerId('firebase-uid_123'), true);
});

function harness(initial) {
  const data = structuredClone(initial);
  const read = path => path.split('/').reduce((value, key) => value?.[key], data) ?? null;
  const snapshot = value => ({ val: () => value, exists: () => value != null, child: path => snapshot(path.split('/').reduce((v, key) => v?.[key], value) ?? null) });
  const db = { ref(path) {
    let field, value;
    return {
      orderByChild(key) { field = key; return this; },
      equalTo(uid) { value = uid; return this; },
      async get() { const record = read(path); return snapshot(field ? Object.fromEntries(Object.entries(record || {}).filter(([, entry]) => entry[field] === value)) : record); },
      async transaction(change) {
        // Model the Admin SDK's cold-cache callback before the server supplies the record.
        if (read(path) !== null && change(null) === undefined) return { committed: false, snapshot: snapshot(null) };
        const next = change(read(path));
        if (next !== undefined) {
          const keys = path.split('/');
          let target = data;
          for (const key of keys.slice(0, -1)) target = target[key] ??= {};
          target[keys.at(-1)] = next;
        }
        return { committed: next !== undefined, snapshot: snapshot(read(path)) };
      },
    };
  } };
  const routes = {};
  const auth = () => {};
  const app = Object.fromEntries(['get', 'post'].map(method => [method, (path, middleware, handler) => {
    assert.equal(middleware, auth);
    routes[`${method} ${path}`] = handler;
  }]));
  registerConnectionRoutes(app, db, auth);
  return async (route, uid, params = {}, body = {}) => {
    const result = { status: 200 };
    const res = { set() {}, status(code) { result.status = code; return this; }, json(value) { result.body = value; return this; } };
    await routes[route]({ uid, params, body }, res);
    return result;
  };
}
const gamer = name => ({ questResults: { latest: { name } } });
test('send notifies only recipient, deduplicates, and acceptance is visible to both users', async () => {
  const call = harness({ users: { a: gamer('Alice'), b: gamer('Bob'), c: gamer('Cara') } });
  const sent = await call('post /api/connections/:uid', 'a', { uid: 'b' });
  assert.equal(sent.status, 200);
  const duplicate = await call('post /api/connections/:uid', 'a', { uid: 'b' });
  assert.equal(duplicate.body.connection.id, sent.body.connection.id);
  const received = await call('get /api/connections', 'b');
  assert.equal(received.body.connections.length, 1);
  assert.equal(received.body.connections[0].fromName, 'Alice');
  assert.equal((await call('get /api/connections', 'c')).body.connections.length, 0);
  const id = sent.body.connection.id;
  assert.equal((await call('post /api/connections/:id/respond', 'a', { id }, { action: 'accept' })).status, 403);
  assert.equal((await call('post /api/connections/:id/respond', 'b', { id }, { action: 'accept' })).body.connection.status, 'accepted');
  assert.equal((await call('get /api/connections', 'a')).body.connections[0].status, 'accepted');
  assert.equal((await call('post /api/connections/:id/respond', 'b', { id }, { action: 'accept' })).status, 200);
  assert.equal((await call('post /api/connections/:id/respond', 'b', { id }, { action: 'decline' })).status, 409);
});
test('self requests, missing recipients and blocked pairs cannot send requests', async () => {
  const call = harness({ users: { a: gamer('Alice'), b: { ...gamer('Bob'), blockedGamers: { a: true } } } });
  assert.equal((await call('post /api/connections/:uid', 'a', { uid: 'a' })).status, 400);
  assert.equal((await call('post /api/connections/:uid', 'a', { uid: 'missing' })).status, 404);
  assert.equal((await call('post /api/connections/:uid', 'a', { uid: 'b' })).status, 403);
  assert.equal((await call('post /api/connections/:uid', 'b', { uid: 'a' })).status, 403);
});

test('missing Firebase indexes fall back to a server read filtered to the authenticated participant', async () => {
  const records = {
    incoming: { from: 'alice', to: 'me' },
    outgoing: { from: 'me', to: 'bob' },
    private: { from: 'alice', to: 'bob' },
  };
  let reads = 0;
  const db = { ref: () => ({
    orderByChild() { return { equalTo() { return { get: async () => { throw new Error('Index not defined, add .indexOn'); } }; } }; },
    async get() { reads++; return { val: () => records }; },
  }) };
  assert.deepEqual(await loadUserConnections(db, 'me'), { incoming: records.incoming, outgoing: records.outgoing });
  assert.equal(reads, 1);
});
test('other database errors propagate instead of being hidden by the index fallback', async () => {
  const db = { ref: () => ({ orderByChild: () => ({ equalTo: () => ({ get: async () => { throw new Error('Permission denied'); } }) }) }) };
  await assert.rejects(loadUserConnections(db, 'me'), /Permission denied/);
});
