export const GAME_CACHE_KEY = 'vibecheck.gameRecc.cache';
const FRESH_FOR = 5 * 60 * 1000;

/**
 * Separate cached lists by age, trait scores and active filters.
 * @param {object} profile Recommendation profile.
 * @param {string} genre Selected genre, or empty for inferred genre.
 * @param {string} platform Selected platform, or empty for any platform.
 * @returns {string} Stable cache key for equivalent inputs.
 */
export function recommendationKey(profile, genre, platform) {
  return JSON.stringify([profile?.age, Object.entries(profile?.traitScores ?? {}).sort(), genre || 'auto', platform || 'any']);
}

/**
 * Read optional cached lists and label their five-minute freshness window.
 * Stale data is retained for a caller-labelled network-failure fallback.
 * @param {string} key Value returned by recommendationKey.
 * @param {Storage} [storage] Browser storage or an injected equivalent.
 * @param {number} [now] Current timestamp in milliseconds.
 * @returns {object|null} Cached lists with freshness, or null for unusable storage/data.
 */
export function readRecommendations(key, storage = localStorage, now = Date.now()) {
  try {
    const entry = JSON.parse(storage.getItem(GAME_CACHE_KEY))?.[key];
    if (!entry || !Array.isArray(entry.curated) || !Array.isArray(entry.trending)) return null;
    return { ...entry, fresh: now >= entry.fetchedAt && now - entry.fetchedAt < FRESH_FOR };
  } catch { return null; }
}
