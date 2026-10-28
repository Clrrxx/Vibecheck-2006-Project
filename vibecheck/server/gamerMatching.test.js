import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingProfilesFromUsers } from './gamerMatching.js';
const scores = { O: 50, C: 75, E: 25, A: 100, N: 0 };
const report = { name: 'Test gamer', title: 'Thoughtful Navigator', traits: Object.fromEntries(Object.entries(scores).map(([key, position]) => [key, { position }])), answers: ['private'] };
test('matches existing users without separate profiles and exposes only matching fields', () => {
  const user = { questResults: { latest: report }, profile: { firstName: 'Private' }, email: 'secret', steam: { steamId: 'private' }, blockedGamers: { private: true } };
  assert.deepEqual(matchingProfilesFromUsers({ me: user, other: user, incomplete: { profile: {} }, invalid: { questResults: { latest: { ...report, traits: {} } } } }, 'me'), {
    other: { name: report.name, title: report.title, scores },
  });
  assert.deepEqual(matchingProfilesFromUsers(null, 'me'), {});
});
test('missing titles and invalid scores cannot enter matching', () => {
  assert.deepEqual(matchingProfilesFromUsers({ a: { questResults: { latest: { ...report, title: '' } } }, b: { questResults: { latest: { ...report, traits: { ...report.traits, O: { position: 101 } } } } } }, 'me'), {});
});
