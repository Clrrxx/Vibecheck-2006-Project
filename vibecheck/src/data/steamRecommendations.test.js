import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTaste, loadSteamRecommendations, playWeight, rankSteamCandidates, selectSteamSeeds } from './steamRecommendations.js';

const game = (id, name, genre = 'action', tag = 'roguelike') => ({ id, name, genres: [{ slug: genre, name: genre }], tags: tag ? [{ slug: tag, name: tag, language: 'eng' }] : [] });
const seed = (id, name, hours, genre, tag) => ({ appId: id, name, minutesTotal: hours * 60, minutesLast2Weeks: 0, rawg: game(id, name, genre, tag) });
const steam = { gamesVisible: true, games: [seed(1, 'Hades', 20)] };

test('exact feature match scores 100; partial and unrelated candidates score lower', () => {
  const taste = buildTaste(steam.games);
  const ranked = rankSteamCandidates([game(2, 'Exact'), game(3, 'Genre only', 'action', 'racing'), game(4, 'Unrelated', 'puzzle', 'racing')], taste, steam.games);
  assert.deepEqual(ranked.map(item => [item.name, item.fit]), [['Exact', 100], ['Genre only', 70]]);
  assert.equal(ranked[0].because, 'Hades');
  assert.deepEqual(ranked[0].sharedTags, ['roguelike']);
});

test('owned names, known RAWG IDs and duplicate results are excluded while sequels remain', () => {
  const taste = buildTaste(steam.games);
  const ranked = rankSteamCandidates([game(99, 'Hades™'), game(1, 'Alternate edition name'), game(2, 'Hades II'), game(2, 'Hades II')], taste, steam.games);
  assert.deepEqual(ranked.map(item => item.id), [2]);
});

test('playtime is damped, recent play boosts seeds, and unplayed games have no vote', () => {
  assert.equal(playWeight({ minutesTotal: 0, minutesLast2Weeks: 0 }), 0);
  assert.ok(playWeight(seed(1, 'Long', 1000)) / playWeight(seed(2, 'Short', 10)) < 3);
  assert.ok(playWeight({ minutesTotal: 60, minutesLast2Weeks: 60 }) > playWeight({ minutesTotal: 60, minutesLast2Weeks: 0 }));
  const selected = selectSteamSeeds({ games: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, seed(i, `Game ${i}`, i)])) });
  assert.equal(selected.length, 12);
  assert.equal(selected[0].appId, 19);
  assert.equal(selectSteamSeeds({ games: [seed(0, 'Unplayed', 0)] }).length, 0);
});

test('tag-free profiles use genres only; missing candidate tags do not inflate fit', () => {
  const noTags = buildTaste([seed(1, 'No tags', 10, 'action', null)]);
  assert.equal(rankSteamCandidates([game(2, 'Match')], noTags, [])[0].fit, 100);
  assert.equal(rankSteamCandidates([game(2, 'No candidate tags', 'action', null)], buildTaste(steam.games), [])[0].fit, 70);
});

test('more played genres rank ahead of weaker preferences and scores remain bounded', () => {
  const taste = buildTaste([seed(1, 'Favourite', 100, 'action'), seed(2, 'Occasional', 1, 'puzzle', 'logic')]);
  const ranked = rankSteamCandidates([game(3, 'Puzzle', 'puzzle', 'logic'), game(4, 'Action')], taste, []);
  assert.equal(ranked[0].name, 'Action');
  assert.ok(ranked.every(item => Number.isFinite(item.fit) && item.fit >= 0 && item.fit <= 100));
});

test('store capabilities and non-English tags do not count as gameplay preferences', () => {
  const source = seed(1, 'Favourite', 10);
  source.rawg.tags.push({ slug: 'full-controller-support', language: 'eng' }, { slug: 'steam-cloud', language: 'eng' }, { slug: 'foreign', language: 'rus' });
  const taste = buildTaste([source]);
  assert.deepEqual(Object.keys(taste.tags), ['roguelike']);
});

test('full request flow matches exact seed titles, filters owned games, and reuses metadata cache', async () => {
  const cache = new Map();
  let lookups = 0;
  const fetchImpl = async url => {
    assert.equal(url.searchParams.get('stores'), '1');
    if (url.searchParams.has('search')) lookups++;
    return { ok: true, json: async () => ({ results: url.searchParams.has('search') ? [game(1, 'Hades')] : [game(1, 'Hades'), game(2, 'New match')] }) };
  };
  const options = { steam, key: 'test', signal: new AbortController().signal, storage: { getItem: key => cache.get(key), setItem: (key, value) => cache.set(key, value) }, fetchImpl };
  const result = await loadSteamRecommendations(options);
  assert.equal(result.seeds.length, 1);
  assert.equal(result.games[0].name, 'New match');
  assert.equal(result.games[0].fit, 100);
  await loadSteamRecommendations(options);
  assert.equal(lookups, 1);
});

test('ambiguous seed names cannot silently become unrelated recommendations', async () => {
  const result = await loadSteamRecommendations({ steam, key: 'test', signal: new AbortController().signal, fetchImpl: async () => ({ ok: true, json: async () => ({ results: [game(99, 'Hades II')] }) }) });
  assert.equal(result.seeds.length, 0);
  assert.equal(result.games.length, 0);
});

test('missing credentials, API failures and cancellation are surfaced', async () => {
  await assert.rejects(loadSteamRecommendations({ steam, key: '', signal: new AbortController().signal }), /RAWG isn’t configured/);
  await assert.rejects(loadSteamRecommendations({ steam, key: 'test', signal: new AbortController().signal, fetchImpl: async () => ({ ok: false, status: 429 }) }), /couldn’t identify/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadSteamRecommendations({ steam, key: 'test', signal: controller.signal, fetchImpl: async () => { throw new DOMException('Aborted', 'AbortError'); } }), { name: 'AbortError' });
});
