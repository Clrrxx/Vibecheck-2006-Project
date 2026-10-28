export const TRAIT_KEYS = ['O', 'C', 'E', 'A', 'N'];

export function validScores(scores) {
  return TRAIT_KEYS.every(key => Number.isFinite(scores?.[key]) && scores[key] >= 0 && scores[key] <= 100);
}

export function rankGamers(scores, profiles, uid, blocked = {}, { title = '', minimum = 0 } = {}) {
  if (!validScores(scores)) return [];
  return Object.entries(profiles || {})
    .filter(([id, profile]) => id !== uid && !blocked[id] && validScores(profile?.scores) && typeof profile.name === 'string' && typeof profile.title === 'string')
    .map(([id, profile]) => ({
      ...profile, id,
      compatibility: Math.round(100 - TRAIT_KEYS.reduce((sum, key) => sum + Math.abs(scores[key] - profile.scores[key]), 0) / 5),
      commonTraits: TRAIT_KEYS.filter(key => Math.abs(scores[key] - profile.scores[key]) <= 15),
    }))
    .filter(profile => (!title || profile.title === title) && profile.compatibility >= minimum)
    .sort((a, b) => b.compatibility - a.compatibility || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
