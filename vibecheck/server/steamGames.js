// Recent playtime comes from GetRecentlyPlayedGames; lifetime and library from GetOwnedGames.
/**
 * Join recent playtime to owned games by Steam app ID and normalize field names.
 * @param {object[]|undefined} ownedGames Owned-game response; absent for private libraries.
 * @param {object[]} [recentlyPlayedGames=[]] Recent-game response from Steam.
 * @returns {object[]} Normalized game records sorted by lifetime playtime.
 */
export function normalizeSteamGames(ownedGames, recentlyPlayedGames = []) {
  const recentMinutes = new Map(recentlyPlayedGames.map(game => [game.appid, game.playtime_2weeks ?? 0]));
  return (ownedGames ?? []).map(game => ({
    appId: game.appid,
    name: game.name ?? `App ${game.appid}`,
    minutesTotal: game.playtime_forever ?? 0,
    minutesLast2Weeks: recentMinutes.get(game.appid) ?? 0,
  })).sort((a, b) => b.minutesTotal - a.minutesTotal);
}
