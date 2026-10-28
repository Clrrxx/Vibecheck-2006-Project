import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CACHE_KEY, recommendationKey, readRecommendations } from './gameReccCache.js';

test('cache keys separate profiles, age restrictions and filters', () => {
  const profile = { age: 21, traitScores: { openness: 80, conscientiousness: 70 } };
  const key = recommendationKey(profile, '', '');
  assert.equal(key, recommendationKey({ ...profile, traitScores: { conscientiousness: 70, openness: 80 } }, '', ''));
  assert.notEqual(key, recommendationKey({ ...profile, age: 13 }, '', ''));
  assert.notEqual(key, recommendationKey({ ...profile, traitScores: { openness: 20 } }, '', ''));
  assert.notEqual(key, recommendationKey(profile, 'strategy', '4'));
});

test('fresh cache expires after five minutes but remains available for fallback', () => {
  const storage = { getItem: key => key === GAME_CACHE_KEY ? JSON.stringify({ sample: { curated: [], trending: [], fetchedAt: 1000 } }) : null };
  assert.equal(readRecommendations('sample', storage, 2000).fresh, true);
  assert.equal(readRecommendations('sample', storage, 301000).fresh, false);
  assert.equal(readRecommendations('sample', storage, 500).fresh, false);
  assert.equal(readRecommendations('missing', storage, 2000), null);
});

test('corrupt or blocked storage falls back to loading from the API', () => {
  assert.equal(readRecommendations('x', { getItem: () => '{broken' }), null);
  assert.equal(readRecommendations('x', { getItem: () => JSON.stringify({ x: {} }) }), null);
  assert.equal(readRecommendations('x', { getItem: () => { throw new Error('blocked'); } }), null);
});
