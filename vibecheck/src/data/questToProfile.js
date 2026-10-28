// src/data/questToProfile.js
const KEY_MAP = { O: 'openness', C: 'conscientiousness', E: 'extraversion', A: 'agreeableness', N: 'neuroticism' };

/**
 * Translate saved Big Five scores into the recommendation profile vocabulary.
 * @param {object|null} report Completed assessment with trait positions.
 * @param {number} age Eligibility age supplied by caller (currently a prototype constant).
 * @returns {object|null} Derived profile, or null when any required score is missing.
 */
export function questToProfile(report, age) {
  if (!report?.traits) return null;
  const traitScores = {};
  for (const [short, long] of Object.entries(KEY_MAP)) {
    const value = report.traits[short]?.position;
    if (!Number.isFinite(value)) return null;
    traitScores[long] = value;
  }
  return { archetypeTitle: report.title, age, traitScores };
}

