import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSteamGames } from './steamGames.js';

test('joins dedicated recent playtime to owned games by app ID, preserving lifetime ordering', () => {
  const owned = [{ appid: 1, name: 'Older game', playtime_forever: 1000 }, { appid: 2, name: 'Recent game', playtime_forever: 200 }];
  const result = normalizeSteamGames(owned, [{ appid: 2, playtime_2weeks: 120 }, { appid: 99, playtime_2weeks: 300 }]);
  assert.deepEqual(result, [
    { appId: 1, name: 'Older game', minutesTotal: 1000, minutesLast2Weeks: 0 },
    { appId: 2, name: 'Recent game', minutesTotal: 200, minutesLast2Weeks: 120 },
  ]);
  assert.equal(owned[0].minutesLast2Weeks, undefined);
});
test('missing/private library and no recent activity remain empty or zero', () => {
  assert.deepEqual(normalizeSteamGames(undefined), []);
  assert.deepEqual(normalizeSteamGames([{ appid: 7 }]), [{ appId: 7, name: 'App 7', minutesTotal: 0, minutesLast2Weeks: 0 }]);
});
