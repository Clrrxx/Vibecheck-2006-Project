import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../firebase';

// Live account data for a signed-in user, read from Realtime Database:
//   users/<uid>/profile  -> { firstName, lastName }
//   users/<uid>/steam    -> { steamId, personaName, avatar, gameCount, totalMinutes, twoWeekMinutes, games: [...] }
//
// Any page can use it:   const { steam } = useAccountProfile(user);
/**
 * Subscribe to the signed-in owner's account profile and latest Steam import.
 * Effects release both database listeners when the UID changes or view unmounts.
 * @param {{uid: string}|null} user Firebase user from the protected-route context.
 * @returns {object} Profile, Steam record, loading state and display-name fallbacks.
 */
export default function useAccountProfile(user) {
  const uid = user?.uid;
  const [state, setState] = useState({ profile: null, steam: null, loading: Boolean(database) });

  useEffect(() => {
    if (!database || !uid) return;
    const seen = { profile: false, steam: false };
    const update = (key, value) => {
      seen[key] = true;
      setState(prev => ({ ...prev, [key]: value, loading: !(seen.profile && seen.steam) }));
    };
    const onError = key => () => update(key, null);
    const stopProfile = onValue(ref(database, `users/${uid}/profile`), s => update('profile', s.val()), onError('profile'));
    const stopSteam = onValue(ref(database, `users/${uid}/steam`), s => update('steam', s.val()), onError('steam'));
    return () => { stopProfile(); stopSteam(); };
  }, [uid]);

  const first = state.profile?.firstName?.trim();
  const displayName = first || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Player';
  return { ...state, displayName, initial: displayName.charAt(0).toUpperCase() };
}
