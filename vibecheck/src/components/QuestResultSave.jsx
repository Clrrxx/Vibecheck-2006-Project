import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, serverTimestamp, set } from 'firebase/database';
import { auth, database } from '../firebase';
import { buildQuestResult } from '../data/questResult';
import { cacheQuestResult } from '../data/localQuestResult';

/**
 * Cache a completed quest, then save to its owner's fixed latest-result path.
 * Retries are idempotent at that path; failed writes retain the local copy.
 * @param {object} props Answers, adventurer details and confirmation visibility.
 * @returns {import('react').ReactElement|null} Save state/retry UI when needed.
 */
export default function QuestResultSave({ answers, name, avatar, showConfirmation }) {
  const [status, setStatus] = useState({ kind: 'loading', message: 'Preparing to save your results…' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let slowSaveTimer;
    const unsubscribe = onAuthStateChanged(auth, user => {
      const request = ++generation;
      clearTimeout(slowSaveTimer);
      if (!user) {
        setStatus({ kind: 'guest', message: 'Your results are saved on this browser. Create an account to save them to your profile.' });
        return;
      }
      let report;
      try {
        report = buildQuestResult({ answers, name, avatar });
        cacheQuestResult(user.uid, { ...report, savedAt: Date.now() });
      } catch (error) {
        setStatus({ kind: 'error', message: error.message });
        return;
      }
      if (!database) {
        setStatus({ kind: 'configuration', message: 'Cloud saving is not configured yet. Your results remain on this browser.' });
        return;
      }
      setStatus({ kind: 'saving', message: 'Saving your results to your profile…' });
      slowSaveTimer = setTimeout(() => {
        if (active && request === generation) setStatus({ kind: 'saving', message: 'Still waiting for confirmation. Keep this page open while your results save.' });
      }, 12000);
      // Use a fixed path so retries and refreshes cannot create duplicate reports.
      Promise.resolve().then(() => {
        if (!active || request !== generation) return;
        return set(ref(database, `users/${user.uid}/questResults/latest`), { ...report, savedAt: serverTimestamp() });
      }).then(() => {
        if (active && request === generation) {
          clearTimeout(slowSaveTimer);
          setStatus({ kind: 'saved', message: 'Results saved to your profile.' });
        }
      }).catch(error => {
        if (active && request === generation) {
          clearTimeout(slowSaveTimer);
          const denied = error.code === 'PERMISSION_DENIED' || error.code === 'database/permission-denied';
          setStatus({ kind: 'error', message: denied
            ? 'Cloud saving was denied. Your results remain on this browser; check the database permissions and retry.'
            : 'We couldn’t save your results to your profile. Your browser copy is still available. Please retry.' });
        }
      });
    }, () => {
      if (active) setStatus({ kind: 'error', message: 'We couldn’t confirm your account. Please retry saving.' });
    });
    return () => { active = false; generation += 1; clearTimeout(slowSaveTimer); unsubscribe(); };
  }, [answers, name, avatar, attempt]);

  // Revisiting results stays quiet; saving failures still offer a way to retry.
  if (!showConfirmation && ['loading', 'saving', 'saved'].includes(status.kind)) return null;

  return <div className={`quest-cloud-save ${status.kind}`}>
    <p role="status" aria-live="polite">{status.message}</p>
    {status.kind === 'guest' && <Link to="/signup">Create an account →</Link>}
    {status.kind === 'error' && <button type="button" className="quest-secondary" onClick={() => setAttempt(value => value + 1)}>Retry saving</button>}
  </div>;
}
