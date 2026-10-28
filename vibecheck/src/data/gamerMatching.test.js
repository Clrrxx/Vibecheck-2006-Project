import test from 'node:test';
import assert from 'node:assert/strict';
import { rankGamers, validScores } from './gamerMatching.js';

const scores = { O: 50, C: 50, E: 50, A: 50, N: 50 };
const player = (name, values = scores) => ({ name, title: 'Versatile Adventurer', scores: values });
test('similarity ranks identical, partial and opposite profiles and filters owner and blocks', () => {
  const profiles = { self: player('Me'), same: player('Same'), partial: player('Partial', { ...scores, O: 100 }), opposite: player('Opposite', { O: 0, C: 0, E: 0, A: 0, N: 0 }), blocked: player('Hidden'), malformed: player('Invalid', { O: 50 }) };
  const results = rankGamers(scores, profiles, 'self', { blocked: true });
  assert.deepEqual(results.map(p => [p.id, p.compatibility]), [['same', 100], ['partial', 90], ['opposite', 50]]);
  assert.equal(results[0].commonTraits.length, 5);
  assert.equal(rankGamers(scores, profiles, 'self', {}, { minimum: 100 }).length, 2);
  assert.deepEqual(rankGamers(scores, profiles, 'self', {}, { title: 'Other' }), []);
  assert.deepEqual(rankGamers(null, profiles, 'self'), []);
  assert.deepEqual(rankGamers(scores, null, 'self'), []);
});
test('scores reject invalid ranges and non-numbers', () => {
  assert.equal(validScores({ ...scores, N: 101 }), false);
  assert.equal(validScores({ ...scores, N: NaN }), false);
});
