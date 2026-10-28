import test from 'node:test';
import assert from 'node:assert/strict';
import { activityBand, parseTarget, targetComparison } from './gamingBalance.js';

test('activity bands use the full 14-day average and exact product boundaries', () => {
  assert.equal(activityBand(0).label, 'No recent activity');
  assert.equal(activityBand(NaN).label, 'No recent activity');
  assert.equal(activityBand(14 * 60 - 1).label, 'Occasional player');
  assert.equal(activityBand(14 * 60).label, 'Regular player');
  assert.equal(activityBand(14 * 180).label, 'Regular player');
  assert.equal(activityBand(14 * 180 + 1).label, 'Avid player');
  assert.equal(activityBand(14 * 90).average, 90);
});
test('personal targets accept zero and quarter hours but reject missing or invalid input', () => {
  assert.equal(parseTarget('0'), 0);
  assert.equal(parseTarget('1.25'), 1.25);
  assert.equal(parseTarget('24'), 24);
  for (const value of ['', ' ', null, 'NaN', 'Infinity', '-1', '25', '1.1']) assert.equal(parseTarget(value), null);
});
test('target comparisons handle zero goals, no goal, and exact equality without daily claims', () => {
  assert.equal(targetComparison(120, null), null);
  assert.deepEqual(targetComparison(120, 2), { above: false, difference: 0 });
  assert.deepEqual(targetComparison(180, 2), { above: true, difference: 1 });
  assert.deepEqual(targetComparison(60, 2), { above: false, difference: 1 });
  assert.deepEqual(targetComparison(60, 0), { above: true, difference: 1 });
  assert.deepEqual(targetComparison(0, 0), { above: false, difference: 0 });
});
