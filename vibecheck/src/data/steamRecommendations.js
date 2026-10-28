import { buildSteamInsights } from './steamInsights.js';
import { matchRawgGame } from './rawgArtwork.js';

export const normalizeTitle = name => String(name).replace(/[™®]/g, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const storeTags = new Set(['full-controller-support', 'partial-controller-support', 'controller', 'achievements', 'in-app-purchases', 'remote-play-on-tv', 'remote-play-on-tablet', 'remote-play-on-phone']);
const gameplayTag = item => item.language === 'eng' && !item.slug?.startsWith('steam-') && !storeTags.has(item.slug);
const features = (game, field) => [...new Set((game?.[field] ?? []).filter(item => field !== 'tags' || gameplayTag(item)).map(item => item.slug).filter(Boolean))];
export const playWeight = game => 0.8 * Math.log1p(game.minutesTotal / 60) + 0.2 * Math.log1p(game.minutesLast2Weeks / 60);

/**
 * @param {object} steam Imported Steam library.
 * @returns {object[]} Up to twelve played games ranked by damped lifetime/recent evidence.
 */
export function selectSteamSeeds(steam) {
  return buildSteamInsights(steam).games.filter(game => playWeight(game) > 0).sort((a, b) => playWeight(b) - playWeight(a) || a.name.localeCompare(b.name)).slice(0, 12);
}

/**
 * @param {object[]} seeds Played games with identified RAWG records.
 * @returns {object} Weighted genre/tag feature vectors and the supporting seed records.
 */
export function buildTaste(seeds) {
  const taste = { genres: {}, tags: {}, seeds };
  for (const seed of seeds) {
    for (const field of ['genres', 'tags']) {
      const values = features(seed.rawg, field);
      // Each game contributes one vote split across its features, scaled by playtime.
      for (const slug of values) taste[field][slug] = (taste[field][slug] ?? 0) + playWeight(seed) / values.length;
    }
  }
  return taste;
}

function similarity(vector, slugs) {
  const length = Math.hypot(...Object.values(vector));
  return length && slugs.length ? slugs.reduce((sum, slug) => sum + (vector[slug] ?? 0), 0) / (length * Math.sqrt(slugs.length)) : 0;
}

/**
 * Rank candidates by feature similarity and remove known owned/duplicate titles.
 * @param {object[]} candidates RAWG game records.
 * @param {object} taste Weighted vectors from buildTaste.
 * @param {object[]} owned Imported owned-game records used for title exclusions.
 * @returns {object[]} Ranked candidates with bounded fit and supporting explanations.
 */
export function rankSteamCandidates(candidates, taste, owned) {
  const ownedNames = new Set(owned.map(game => normalizeTitle(game.name)));
  const ownedIds = new Set(taste.seeds.map(seed => seed.rawg.id));
  const seen = new Set();
  return candidates.filter(game => {
    if (!game.id || seen.has(game.id) || ownedIds.has(game.id) || ownedNames.has(normalizeTitle(game.name))) return false;
    seen.add(game.id);
    return true;
  }).map(game => {
    const genres = features(game, 'genres');
    const tags = features(game, 'tags');
    const genreScore = similarity(taste.genres, genres);
    const tagScore = similarity(taste.tags, tags);
    const hasTags = Object.keys(taste.tags).length > 0;
    const score = hasTags ? 0.7 * genreScore + 0.3 * tagScore : genreScore;
    const sharedGenres = (game.genres ?? []).filter(item => taste.genres[item.slug] > 0).map(item => item.name);
    const sharedTags = (game.tags ?? []).filter(item => taste.tags[item.slug] > 0).sort((a, b) => taste.tags[b.slug] - taste.tags[a.slug]).slice(0, 3).map(item => item.name);
    const support = taste.seeds.map(seed => ({ name: seed.name, score: 0.7 * similarity(Object.fromEntries(features(seed.rawg, 'genres').map(slug => [slug, 1])), genres) + 0.3 * similarity(Object.fromEntries(features(seed.rawg, 'tags').map(slug => [slug, 1])), tags) })).sort((a, b) => b.score - a.score)[0];
    return { ...game, fit: Math.round(Math.min(1, Math.max(0, score)) * 100), genreFit: Math.round(genreScore * 100), tagFit: hasTags ? Math.round(tagScore * 100) : null, sharedGenres, sharedTags, because: support?.score > 0 ? support.name : null };
  }).filter(game => game.fit > 0).sort((a, b) => b.fit - a.fit || (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name)).slice(0, 12);
}

/**
 * Orchestrate seed identification, optional metadata caching and candidate ranking.
 * @param {object} options Steam record, RAWG key and optional signal/storage/fetchImpl.
 * @returns {Promise<object>} Recommendations plus coverage, seeds and partial-failure counts.
 * @throws {Error} Missing credentials, unusable API responses or failed requests.
 */
export async function loadSteamRecommendations({ steam, key, signal, storage, fetchImpl = fetch }) {
  if (!key) throw new Error('RAWG isn’t configured. Add VITE_RAWG_KEY and restart the app.');
  async function request(params) {
    const url = new URL('https://api.rawg.io/api/games');
    url.search = new URLSearchParams({ key, ...params });
    const response = await fetchImpl(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) });
    if (!response.ok) throw new Error(`RAWG could not load games (HTTP ${response.status}). Try again shortly.`);
    const body = await response.json();
    if (!Array.isArray(body.results)) throw new Error('RAWG returned an unexpected game list. Please try again.');
    return body.results;
  }
  const selected = selectSteamSeeds(steam);
  const matched = [];
  let failed = 0;
  let cursor = 0;
  // Bound library lookups to three simultaneous requests.
  await Promise.all(Array.from({ length: Math.min(3, selected.length) }, async () => {
    while (cursor < selected.length) {
      const game = selected[cursor++];
      const cacheKey = `vibecheck.steamTaste.v1:${game.appId}:${normalizeTitle(game.name)}`;
      try {
        let rawg;
        try {
          const cached = JSON.parse(storage?.getItem(cacheKey) ?? 'null');
          if (cached?.game && Date.now() >= cached.at && Date.now() - cached.at < 7 * 86400000) rawg = cached.game;
        } catch { /* Caching is optional. */ }
        if (!rawg) {
          rawg = matchRawgGame(game.name, await request({ search: game.name, search_precise: 'true', search_exact: 'true', stores: '1', page_size: '10' }));
          if (rawg) try { storage?.setItem(cacheKey, JSON.stringify({ at: Date.now(), game: rawg })); } catch { /* Caching is optional. */ }
        }
        if (rawg && features(rawg, 'genres').length) matched.push({ ...game, rawg });
      } catch (error) {
        if (signal.aborted) throw error;
        failed += 1;
      }
    }
  }));
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  if (!matched.length && failed) throw new Error('RAWG couldn’t identify your played games right now. Please try again.');
  matched.sort((a, b) => playWeight(b) - playWeight(a) || a.name.localeCompare(b.name));
  const taste = buildTaste(matched);
  const topGenres = Object.entries(taste.genres).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([slug]) => slug);
  if (!topGenres.length) return { games: [], seeds: matched, considered: selected.length, failed, taste };
  const results = await Promise.allSettled(topGenres.map(genres => request({ genres, stores: '1', platforms: '4', ordering: '-added', page_size: '40' })));
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const successful = results.filter(result => result.status === 'fulfilled');
  if (!successful.length) throw new Error('RAWG couldn’t find new games right now. Please try again.');
  return { games: rankSteamCandidates(successful.flatMap(result => result.value), taste, buildSteamInsights(steam).games), seeds: matched, considered: selected.length, failed: failed + results.length - successful.length, taste };
}
