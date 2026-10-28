import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../firebase';
import { cacheQuestResult, readLocalQuestResult } from './localQuestResult';

/**
 * Observe the owner's latest cloud assessment with a completed local fallback.
 * @param {string} uid Authenticated owner UID supplied by the protected page.
 * @returns {{report: object|null, loading: boolean}} Best available result and read state.
 */
export default function useQuestResult(uid) {
  const [state, setState] = useState(() => ({
    report: readLocalQuestResult(uid), loading: Boolean(database),
  }));

  useEffect(() => {
    if (!database) return;
    return onValue(ref(database, `users/${uid}/questResults/latest`), snapshot => {
      const remote = snapshot.val();
      const local = readLocalQuestResult(uid);
      const report = remote && (!local || (remote.savedAt || 0) >= local.savedAt) ? remote : local;
      if (report) cacheQuestResult(uid, report);
      setState({ report, loading: false });
    }, () => setState({ report: readLocalQuestResult(uid), loading: false }));
  }, [uid]);

  return state;
}
