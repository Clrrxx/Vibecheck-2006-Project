import { buildQuestResult } from './questResult.js';

const resultKey = uid => `vibecheck.questResult:${uid}`;

/**
 * Recover only this owner's completed result, recomputing scores from answers.
 * @param {string} uid Owner UID used in the browser storage key.
 * @returns {object|null} Valid completed result, including an available completed draft.
 */
export function readLocalQuestResult(uid) {
  try {
    const cached = JSON.parse(localStorage.getItem(resultKey(uid)));
    if (cached) {
      // Recompute scores from answers rather than trusting cached display values.
      return { ...buildQuestResult({ ...cached, answers: cached.answers.map(a => a.choiceIndex) }), savedAt: cached.savedAt || 0 };
    }
    const quest = JSON.parse(localStorage.getItem(`vibecheck-quest-v1:${uid}`));
    return quest?.step === 15 ? { ...buildQuestResult(quest), savedAt: 0 } : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort owner-scoped local copy; storage failure does not reject cloud results.
 * @param {string} uid Account owner.
 * @param {object} report Completed result including its save timestamp.
 * @returns {void}
 */
export function cacheQuestResult(uid, report) {
  try { localStorage.setItem(resultKey(uid), JSON.stringify(report)); }
  catch { /* Cloud results can still be used when browser storage is unavailable. */ }
}
