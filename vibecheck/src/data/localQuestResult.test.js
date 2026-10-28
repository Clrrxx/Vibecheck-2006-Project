import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestResult } from './questResult.js';
import { cacheQuestResult, readLocalQuestResult } from './localQuestResult.js';

function storage() {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}
const completed = { step: 15, answers: Array(15).fill(1), name: 'Player', avatar: '✦' };

test('existing completed quests supply homepage stats only for their owner', () => {
  storage();
  localStorage.setItem('vibecheck-quest-v1:alice', JSON.stringify(completed));
  assert.equal(readLocalQuestResult('alice').title, 'Versatile Adventurer');
  assert.equal(readLocalQuestResult('alice').traits.O.average, 3);
  assert.equal(readLocalQuestResult('bob'), null);
});

test('unfinished, invalid and unavailable browser data do not produce a result', () => {
  storage();
  for (const quest of [{ ...completed, step: 4 }, { ...completed, answers: [1] }]) {
    localStorage.setItem('vibecheck-quest-v1:alice', JSON.stringify(quest));
    assert.equal(readLocalQuestResult('alice'), null);
  }
  localStorage.setItem('vibecheck-quest-v1:alice', '{broken');
  assert.equal(readLocalQuestResult('alice'), null);
  globalThis.localStorage.getItem = () => { throw new Error('Storage blocked'); };
  assert.equal(readLocalQuestResult('alice'), null);
});

test('completed results survive a new attempt and scores are rebuilt from answers', () => {
  storage();
  const report = { ...buildQuestResult(completed), savedAt: 1234 };
  report.traits.O.average = 99;
  cacheQuestResult('alice', report);
  localStorage.setItem('vibecheck-quest-v1:alice', JSON.stringify({ ...completed, step: 0, answers: Array(15).fill(null) }));
  const result = readLocalQuestResult('alice');
  assert.equal(result.traits.O.average, 3);
  assert.equal(result.savedAt, 1234);
  assert.equal(readLocalQuestResult('bob'), null);
});
