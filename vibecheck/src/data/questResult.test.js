import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuestResult } from './questResult.js';

const adventurer = { name: ' Alex ', avatar: '✦' };

test('a neutral completed quest stores all five scores and the matching report title', () => {
  const report = buildQuestResult({ ...adventurer, answers: Array(15).fill(1) });
  assert.equal(report.name, 'Alex');
  assert.equal(report.title, 'Versatile Adventurer');
  assert.deepEqual(Object.keys(report.traits), ['O', 'C', 'E', 'A', 'N']);
  for (const trait of Object.values(report.traits)) {
    assert.equal(trait.average, 3);
    assert.equal(trait.position, 50);
  }
  assert.equal(report.answers.length, 15);
  assert.deepEqual(report, JSON.parse(JSON.stringify(report)));
});

test('scores reflect reversed choices and retain precision for the saved report', () => {
  const report = buildQuestResult({ ...adventurer, answers: Array(15).fill(0) });
  assert.equal(report.traits.O.average, 7 / 3);
  assert.equal(report.traits.A.average, 11 / 3);
  // Extraversion and agreeableness tie; the report uses the first highest trait.
  assert.equal(report.title, 'Campfire Connector');
  assert.deepEqual(report.answers[0], { encounter: 0, choiceIndex: 0, trait: 'E', score: 5 });
  assert.deepEqual(report.answers[3], { encounter: 3, choiceIndex: 0, trait: 'O', score: 1 });
});

test('incomplete, sparse or invalid answers never produce a database payload', () => {
  for (const answers of [null, [], Array(15), Array(14).fill(1), Array(15).fill(null), Array(15).fill(-1), Array(15).fill(3), Array(15).fill(1.5)]) {
    assert.throws(() => buildQuestResult({ ...adventurer, answers }), /Complete all 15/);
  }
});

test('blank names use the displayed fallback and invalid identity fields are rejected', () => {
  const answers = Array(15).fill(1);
  assert.equal(buildQuestResult({ ...adventurer, name: ' ', answers }).name, 'Adventurer');
  assert.throws(() => buildQuestResult({ ...adventurer, name: 'a'.repeat(25), answers }));
  assert.throws(() => buildQuestResult({ ...adventurer, avatar: 'invalid', answers }));
});
