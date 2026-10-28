import { encounters, scoreQuest } from './quest.js';

/**
 * Validate a completed quest and construct the account's latest-result record.
 * Scores are recomputed from answers; savedAt is supplied by the persistence layer.
 * @param {{answers: number[], name: string, avatar: string}} input Completed attempt.
 * @returns {object} Validated answers, five traits, identity fields and archetype.
 * @throws {Error} If answers or adventurer details are invalid.
 */
export function buildQuestResult({ answers, name, avatar }) {
  if (!Array.isArray(answers) || answers.length !== encounters.length ||
      !encounters.every((encounter, i) => Number.isInteger(answers[i]) && encounter.choices[answers[i]])) {
    throw new Error('Complete all 15 moments before saving your results.');
  }
  if (typeof name !== 'string' || name.length > 24 || !['✦', '☾', '◇', '❋'].includes(avatar)) {
    throw new Error('Your adventurer details could not be saved.');
  }
  const results = scoreQuest(answers);
  const strongest = results.reduce((best, trait) => trait.average > best.average ? trait : best);
  const title = Math.max(...results.map(t => t.average)) - Math.min(...results.map(t => t.average)) < 1
    ? 'Versatile Adventurer' : strongest.title;
  return {
    questionnaireVersion: 1,
    name: name.trim() || 'Adventurer',
    avatar,
    title,
    answers: answers.map((choiceIndex, index) => ({
      encounter: index,
      choiceIndex,
      trait: encounters[index].trait,
      score: encounters[index].choices[choiceIndex].score,
    })),
    traits: Object.fromEntries(results.map(({ key, name, average, position, description, meaning, gameAngle, low, high }) =>
      [key, { name, average, position, description, meaning, gameAngle, low, high }])),
  };
}
