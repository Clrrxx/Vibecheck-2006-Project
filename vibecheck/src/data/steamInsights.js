const minutes = value => Number.isFinite(value) && value > 0 ? value : 0;

/**
 * Normalize Firebase array/object collections and rank imported Steam aggregates.
 * This derives lifetime or last-14-day views, not measured per-day gaming sessions.
 * @param {object|null} steam Latest imported Steam account and game collection.
 * @param {'recent'|'lifetime'} [period='recent'] Ranking time window.
 * @returns {object} Normalized games, rankings, totals and top-five/other breakdown.
 */
export function buildSteamInsights(steam, period = 'recent') {
  // Firebase can return numeric collections as arrays or objects, and omit empty ones.
  const games = Object.values(steam?.games ?? {}).filter(game => game && game.appId != null).map(game => ({
    ...game,
    name: typeof game.name === 'string' && game.name ? game.name : `App ${game.appId}`,
    minutesTotal: minutes(game.minutesTotal),
    minutesLast2Weeks: minutes(game.minutesLast2Weeks),
  }));
  const field = period === 'lifetime' ? 'minutesTotal' : 'minutesLast2Weeks';
  const ranked = [...games].sort((a, b) => b[field] - a[field] || a.name.localeCompare(b.name));
  const totalMinutes = games.reduce((sum, game) => sum + game.minutesTotal, 0);
  const recentMinutes = games.reduce((sum, game) => sum + game.minutesLast2Weeks, 0);
  const periodMinutes = period === 'lifetime' ? totalMinutes : recentMinutes;
  const active = ranked.filter(game => game[field] > 0);
  const top = active.slice(0, 5);
  const otherMinutes = active.slice(5).reduce((sum, game) => sum + game[field], 0);
  return { games, ranked, field, totalMinutes, recentMinutes, periodMinutes, top, otherMinutes,
    playedCount: games.filter(game => game.minutesTotal > 0).length,
    recentCount: games.filter(game => game.minutesLast2Weeks > 0).length,
    topShare: periodMinutes > 0 && top.length ? Math.round(top[0][field] / periodMinutes * 100) : 0,
  };
}

/**
 * @param {number} value Non-negative playtime in minutes.
 * @returns {string} Localized hours with at most one fractional digit.
 */
export function formatHours(value) {
  return (minutes(value) / 60).toLocaleString('en-SG', { maximumFractionDigits: 1 });
}
