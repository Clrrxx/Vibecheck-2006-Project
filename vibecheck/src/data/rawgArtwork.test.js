import test from 'node:test';
import assert from 'node:assert/strict';
import { createRawgArtworkClient, matchRawgGame } from './rawgArtwork.js';

const record = { id: 10, name: 'Hades II', background_image: 'https://media.rawg.io/media/games/hades.jpg', genres: [{ name: 'Action' }], released: '2025-09-25' };
const game = { appId: 42, name: 'Hades II' };

test('artwork matching preserves sequels and rejects ambiguous or unrelated matches', () => {
  assert.equal(matchRawgGame('Hades II', [{ ...record, name: 'Hades' }, record]), record);
  assert.equal(matchRawgGame('Hades II', [{ ...record, name: 'Hades' }]), null);
  assert.equal(matchRawgGame('Hades II', [record, { ...record, id: 11 }]), null);
  assert.equal(matchRawgGame('Hades™ II', [record]), record);
});
test('concurrent library and top-game lookups share a request and reuse cache', async () => {
  let calls = 0;
  const storage = new Map();
  const client = createRawgArtworkClient({ key: 'test', storage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, fetchImpl: async url => {
    calls += 1;
    assert.equal(url.searchParams.get('stores'), '1');
    assert.equal(url.searchParams.get('search'), 'Hades II');
    return { ok: true, json: async () => ({ results: [record] }) };
  } });
  const [first, second] = await Promise.all([client(game), client(game)]);
  assert.equal(first, second);
  assert.equal(first.genres, 'Action');
  assert.equal(first.year, '2025');
  await client(game);
  assert.equal(calls, 1);
  assert.equal(storage.size, 1);
});
test('missing keys, missing matches, failed requests and broken storage leave playtime usable', async () => {
  const disabled = createRawgArtworkClient({ key: '', fetchImpl: () => { throw new Error('Must not request'); } });
  assert.equal(await disabled(game), null);
  const noMatch = createRawgArtworkClient({ key: 'test', storage: { getItem: () => { throw new Error('Blocked'); } }, fetchImpl: async () => ({ ok: true, json: async () => ({ results: [] }) }) });
  assert.equal(await noMatch(game), null);
  let calls = 0;
  const flaky = createRawgArtworkClient({ key: 'test', fetchImpl: async () => { calls += 1; return { ok: calls > 1, json: async () => ({ results: [record] }) }; } });
  await assert.rejects(flaky(game));
  assert.equal((await flaky(game)).id, 10);
});
test('expired cache refreshes and image hosts outside RAWG are rejected', async () => {
  const client = createRawgArtworkClient({ key: 'test', now: () => 10 * 86400000, storage: { getItem: () => JSON.stringify({ at: 0, data: { id: 9 } }) }, fetchImpl: async () => ({ ok: true, json: async () => ({ results: [{ ...record, background_image: 'https://example.com/wrong.jpg' }] }) }) });
  assert.equal(await client(game), null);
});
