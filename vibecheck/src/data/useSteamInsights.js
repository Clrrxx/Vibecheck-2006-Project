import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../firebase';

/**
 * Subscribe to owner-only Steam data and expose explicit read-error/retry state.
 * @param {string} uid Authenticated account owner.
 * @returns {object} Steam data, loading/error state and a retry callback.
 */
export default function useSteamInsights(uid) {
  const [state, setState] = useState({ steam: null, loading: Boolean(database), error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!database || !uid) return;
    return onValue(ref(database, `users/${uid}/steam`), snapshot => {
      setState({ steam: snapshot.val(), loading: false, error: '' });
    }, () => {
      setState(previous => ({ ...previous, loading: false, error: 'We couldn’t load your Steam data. Check your connection and try again.' }));
    });
  }, [uid, attempt]);
  return { ...state, loading: Boolean(database) && state.loading,
    error: !database ? 'The database connection isn’t configured. Add the Firebase database URL to continue.' : state.error,
    retry: () => { setState(previous => ({ ...previous, loading: true, error: '' })); setAttempt(value => value + 1); },
  };
}
