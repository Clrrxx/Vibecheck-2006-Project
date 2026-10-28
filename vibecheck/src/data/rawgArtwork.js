const WEEK = 7 * 24 * 60 * 60 * 1000;
const normalize = name => String(name).replace(/[™®]/g, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function matchRawgGame(name, results) {
  // Preserve sequel numbers and subtitles; a fuzzy first result can be a different game.
  const matches = (results ?? []).filter(game => normalize(game.name) === normalize(name));
  return matches.length === 1 ? matches[0] : null;
}

function artwork(game) {
  if (!game || !Number.isInteger(game.id) || !/^https:\/\/media\.rawg\.io\//.test(game.background_image ?? '')) return null;
  return {
    id: game.id,
    image: game.background_image,
    url: `https://rawg.io/games/${/^[a-z0-9-]+$/.test(game.slug ?? '') ? game.slug : game.id}`,
    genres: (game.genres ?? []).map(genre => genre.name).filter(Boolean).slice(0, 2).join(' · '),
    year: /^\d{4}-/.test(game.released ?? '') ? game.released.slice(0, 4) : '',
  };
}

export function createRawgArtworkClient({ key, fetchImpl = (...args) => fetch(...args), storage, now = Date.now }) {
  const cache = new Map();
  const pending = new Map();
  const queue = [];
  let active = 0;
  function runNext() {
    while (active < 3 && queue.length) {
      const { run, resolve, reject } = queue.shift();
      active += 1;
      Promise.resolve().then(run).then(resolve, reject).finally(() => { active -= 1; runNext(); });
    }
  }
  return function load(game) {
    if (!key || !game?.name) return Promise.resolve(null);
    const cacheKey = `vibecheck.rawgArtwork.v1:${game.appId}:${normalize(game.name)}`;
    let cached = cache.get(cacheKey);
    if (!cached) {
      try { cached = JSON.parse(storage?.getItem(cacheKey) ?? 'null'); } catch { /* Storage is optional. */ }
    }
    if (cached && Number.isFinite(cached.at) && now() >= cached.at && now() - cached.at < (cached.data ? WEEK : WEEK / 7)) return Promise.resolve(cached.data);
    if (pending.has(cacheKey)) return pending.get(cacheKey);
    const request = new Promise((resolve, reject) => {
      queue.push({ resolve, reject, run: async () => {
        const url = new URL('https://api.rawg.io/api/games');
        url.search = new URLSearchParams({ key, search: game.name, search_precise: 'true', search_exact: 'true', stores: '1', page_size: '10' });
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Artwork unavailable');
        const body = await response.json();
        if (!Array.isArray(body.results)) throw new Error('Invalid artwork response');
        const data = artwork(matchRawgGame(game.name, body.results));
        const entry = { at: now(), data };
        cache.set(cacheKey, entry);
        try { storage?.setItem(cacheKey, JSON.stringify(entry)); } catch { /* Memory cache still works. */ }
        return data;
      } });
      runNext();
    }).finally(() => pending.delete(cacheKey));
    pending.set(cacheKey, request);
    return request;
  };
}
