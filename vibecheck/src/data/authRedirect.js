const destinations = new Set(['/', '/questionnaire', '/gamematching', '/gamer-matches', '/friends']);

// Accept only application routes, even if history state has been modified.
/**
 * Resolve only an explicitly allowlisted in-app post-authentication destination.
 * @param {object|null} state Router state that may contain a requested location.
 * @param {string} [fallback='/'] Safe destination when the requested path is unsupported.
 * @returns {string} Allowed path with valid query/hash prefixes, or the fallback.
 */
export function getLoginDestination(state, fallback = '/') {
  const from = state?.from;
  if (!from || (!destinations.has(from.pathname) && !/^\/messages\/[A-Za-z0-9_-]{1,128}$/.test(from.pathname))) return fallback;
  const search = typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '';
  const hash = typeof from.hash === 'string' && from.hash.startsWith('#') ? from.hash : '';
  return `${from.pathname}${search}${hash}`;
}
