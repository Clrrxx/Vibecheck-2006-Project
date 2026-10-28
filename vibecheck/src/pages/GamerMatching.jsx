import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { onValue, ref, set } from 'firebase/database';
import { database } from '../firebase';
import useQuestResult from '../data/useQuestResult';
import { rankGamers, TRAIT_KEYS } from '../data/gamerMatching';
import { traits } from '../data/quest';
import useConnections from '../data/useConnections';
import ConnectionNotifications from '../components/ConnectionNotifications';
import GamerCharacter from '../components/GamerCharacter';
import './GamerMatching.css';

export default function GamerMatching() {
  const user = useOutletContext();
  const connections = useConnections(user);
  const { report, loading: reportLoading } = useQuestResult(user.uid);
  const [directory, setDirectory] = useState({ profiles: {}, blocked: {}, loading: Boolean(database), error: '' });
  const [minimum, setMinimum] = useState(0);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const dialog = useRef(null);

  useEffect(() => {
    if (!database) return;
    const controller = new AbortController();
    let active = true;
    const loadProfiles = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/gamer-matches', {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Couldn’t load gamer matching. Make sure the VibeCheck server is running.');
        if (active) setDirectory(prev => ({ ...prev, profiles: body.profiles || {}, loading: false, error: '' }));
      } catch (error) {
        if (active) setDirectory(prev => ({ ...prev, loading: false, error: error.message === 'Failed to fetch' ? 'Couldn’t reach the VibeCheck server. Start it with cd vibecheck/server && npm start, then try again.' : error.message }));
      }
    };
    loadProfiles();
    const timer = setInterval(loadProfiles, 30000);
    const stopBlocks = onValue(ref(database, `users/${user.uid}/blockedGamers`),
      snapshot => setDirectory(prev => ({ ...prev, blocked: snapshot.val() || {} })),
      () => setMessage('Couldn’t load your blocked gamers. Check your connection and database rules.'));
    return () => { active = false; controller.abort(); clearInterval(timer); stopBlocks(); };
  }, [user, attempt]);

  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);

  const scores = Object.fromEntries(TRAIT_KEYS.map(key => [key, report?.traits?.[key]?.position]));
  const matches = rankGamers(scores, directory.profiles, user.uid, directory.blocked, { title, minimum });
  const titles = [...traits.map(trait => trait.title), 'Versatile Adventurer'].sort();

  async function mutate(path, value, success) {
    setBusy(true);
    setMessage('');
    try {
      await set(ref(database, path), value);
      setMessage(success);
    } catch {
      setMessage('Couldn’t save that change. Check your connection and database rules, then try again.');
    } finally {
      setBusy(false);
    }
  }

  function connectButton(player) {
    const record = connections.find(player.id);
    const incoming = record?.to === user.uid && record.status === 'pending';
    const label = !record ? 'Connect' : record.status === 'accepted' ? 'Connected ✓' : record.status === 'declined' ? 'Request declined' : incoming ? 'Accept connection' : 'Request sent';
    return <button disabled={connections.loading || connections.busy || Boolean(connections.error) || (Boolean(record) && !incoming)} onClick={() => incoming ? connections.respond(record.id, 'accept') : connections.connect(player.id)}>{label}</button>;
  }

  return <main className="players-page">
    <header className="players-topbar"><Link to="/" className="players-brand">◉ vibecheck</Link><Link to="/friends">Friends ({connections.friends.length})</Link><ConnectionNotifications user={user} state={connections} /><Link to="/">← Back to dashboard</Link></header>
    <div className="players-content">
      <header className="players-heading"><span>FIND YOUR PARTY</span><h1>Good games.<br />Better company.</h1><p>Meet gamers with a similar personality. Your next teammate starts with a vibe check.</p></header>
      {!database ? <section className="players-panel"><h2>Matching needs a database connection</h2><p>Configure VITE_FIREBASE_DATABASE_URL to enable gamer matching.</p></section>
        : reportLoading || directory.loading ? <p role="status">Finding your party…</p>
        : directory.error ? <section className="players-panel"><p role="alert">{directory.error}</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button></section>
        : <>
          <section className="players-panel"><h2>{report ? 'Matched from your assessment' : 'Complete your assessment'}</h2><p>{report ? 'Your latest personality results are compared with other gamers who have completed their assessment.' : 'Take the assessment to find gamers with a similar personality.'}</p><Link to="/questionnaire">{report ? 'View your assessment →' : 'Start your assessment →'}</Link></section>
          {connections.error && <p role="alert">{connections.error} <button onClick={() => connections.refresh()}>Retry connections</button></p>}
          {message && <p className="players-message" role="status">{message}</p>}
          {report && <>
            <section className="players-filters" aria-label="Match filters"><label>Personality type<select value={title} onChange={event => setTitle(event.target.value)}><option value="">All types</option>{titles.map(value => <option key={value}>{value}</option>)}</select></label><label>Minimum similarity: {minimum}%<input type="range" min="0" max="100" value={minimum} onChange={event => setMinimum(Number(event.target.value))} /></label><button className="players-secondary" onClick={() => { setTitle(''); setMinimum(0); }}>Reset filters</button></section>
            <p className="players-count">{matches.length} {matches.length === 1 ? 'gamer' : 'gamers'} found · Refreshes every 30 seconds</p>
            {matches.length ? <div className="players-grid">{matches.map(player => <article className="players-card" key={player.id}><GamerCharacter title={player.title} /><span className="players-score">{player.compatibility}% similar</span><h2>{player.name}</h2><p>{player.title}</p><small>{player.commonTraits.length ? `Close in ${player.commonTraits.map(key => traits.find(trait => trait.key === key).name).join(', ')}` : 'A different perspective on play'}</small><button className="players-secondary" onClick={() => setSelected(player.id)}>View gamer</button>{connectButton(player)}</article>)}</div> : <section className="players-panel"><h2>No gamers found yet</h2><p>Try lowering the similarity filter, choosing all types, or inviting another player to complete an assessment.</p></section>}
            <details className="players-panel"><summary>How personality similarity works</summary><p>Similarity is 100 minus the average absolute difference between your five trait scores (each from 0 to 100). Each trait counts equally. This describes personality similarity, not a guarantee of teamwork or friendship.</p></details>
          </>}
          {Object.keys(directory.blocked).length > 0 && <section className="players-panel"><h2>Blocked gamers</h2><p>These gamers are hidden from your results.</p>{Object.keys(directory.blocked).map(id => <div className="players-blocked" key={id}><span>{directory.profiles[id]?.name || 'Unavailable gamer'}</span><button disabled={busy} onClick={() => mutate(`users/${user.uid}/blockedGamers/${id}`, null, 'Gamer unblocked.')}>Unblock</button></div>)}</section>}
        </>}
    </div>
    <dialog ref={dialog} className="players-dialog" onCancel={() => setSelected(null)} onClose={() => setSelected(null)}>
      {(() => {
        const player = matches.find(match => match.id === selected);
        return <><button className="players-close" onClick={() => { dialog.current.close(); setSelected(null); }} aria-label="Close gamer details">×</button>{player ? <><h2>{player.name}</h2><p>{player.title} · {player.compatibility}% similar</p>{connectButton(player)}<dl>{traits.map(trait => <div key={trait.key}><dt>{trait.name}</dt><dd>{Math.round(player.scores[trait.key])} / 100</dd></div>)}</dl><button disabled={busy} onClick={async () => { await mutate(`users/${user.uid}/blockedGamers/${player.id}`, true, 'Gamer hidden from your matches.'); dialog.current?.close(); setSelected(null); }}>Block gamer</button></> : <p>This gamer is no longer in your current results.</p>}</>;
      })()}
    </dialog>
  </main>;
}
