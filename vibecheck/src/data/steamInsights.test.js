import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSteamInsights, formatHours } from './steamInsights.js';

const games = [
  { appId: 1, name: 'Old favourite', minutesTotal: 6000, minutesLast2Weeks: 0 },
  { appId: 2, name: 'New favourite', minutesTotal: 600, minutesLast2Weeks: 300 },
  { appId: 3, name: 'Unplayed', minutesTotal: 0 },
];
test('recent and lifetime rankings use the right window without mutating saved games', () => {
  const recent = buildSteamInsights({ games });
  const lifetime = buildSteamInsights({ games }, 'lifetime');
  assert.equal(recent.top[0].appId, 2);
  assert.equal(lifetime.top[0].appId, 1);
  assert.equal(recent.recentMinutes, 300);
  assert.equal(recent.totalMinutes, 6600);
  assert.equal(recent.recentCount, 1);
  assert.equal(recent.playedCount, 2);
  assert.equal(recent.topShare, 100);
  assert.equal(games[0].appId, 1);
});
test('missing data and invalid playtimes do not create NaN, negative hours, or fake activity', () => {
  assert.equal(buildSteamInsights(null).topShare, 0);
  assert.deepEqual(buildSteamInsights({}).top, []);
  const result = buildSteamInsights({ games: { a: null, b: { appId: 4, minutesTotal: -1, minutesLast2Weeks: Infinity } } });
  assert.equal(result.games[0].name, 'App 4');
  assert.equal(result.totalMinutes, 0);
  assert.equal(result.periodMinutes, 0);
  assert.equal(result.topShare, 0);
  assert.equal(formatHours(NaN), '0');
  assert.equal(formatHours(90), '1.5');
});
test('Firebase object collections work and games outside the top five retain their share', () => {
  const result = buildSteamInsights({ games: Object.fromEntries(Array.from({ length: 7 }, (_, index) => [index, { appId: index, name: `Game ${index}`, minutesLast2Weeks: 60 }])) });
  assert.equal(result.top.length, 5);
  assert.equal(result.otherMinutes, 120);
  assert.equal(result.periodMinutes, 420);
  assert.equal(result.topShare, 14);
});
