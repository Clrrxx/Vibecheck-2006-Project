import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import useConnections from '../data/useConnections';
import ConnectionNotifications from '../components/ConnectionNotifications';
import './GamerMatching.css';
import './Friends.css';

export default function Friends() {
  const user = useOutletContext();
  const state = useConnections(user);
  const [search, setSearch] = useState('');
  const friends = state.friends.filter(friend => friend.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <main className="players-page">
    <header className="players-topbar"><Link to="/" className="players-brand">◉ vibecheck</Link><Link to="/gamer-matches">Find gamers</Link><ConnectionNotifications user={user} state={state} /><Link to="/">← Dashboard</Link></header>
    <div className="players-content">
      <header className="players-heading"><span>YOUR PARTY</span><h1>Friends.</h1><p>Your accepted connections, together in one place.</p></header>
      <div className="friends-toolbar"><label>Search friends<input type="search" placeholder="Search by gamer name" value={search} onChange={event => setSearch(event.target.value)} /></label><span>{state.friends.length} {state.friends.length === 1 ? 'friend' : 'friends'} · Refreshes every 10 seconds</span></div>
      {state.loading ? <p role="status">Loading your friends…</p> : state.error ? <section className="players-panel"><p role="alert">{state.error}</p><button onClick={() => state.refresh()}>Retry</button></section> : friends.length ? <ul className="friends-grid">{friends.map(friend => <li className="friends-card" key={friend.id}><span className="friends-avatar" aria-hidden="true">{friend.name.charAt(0).toUpperCase()}</span><div><h2>{friend.name}</h2><p>Connected ✓</p><small>Friends since {new Date(friend.connectedAt).toLocaleDateString()}</small></div><Link className="friend-message" to={`/messages/${encodeURIComponent(friend.id)}`}>Message ↗</Link></li>)}</ul> : <section className="players-panel"><h2>{search.trim() ? 'No matching friends' : 'Your party starts here'}</h2><p>{search.trim() ? 'Try another gamer name.' : 'Send a connection request or accept one in your notifications. Once accepted, you’ll appear in each other’s Friends list.'}</p>{!search.trim() && <Link to="/gamer-matches">Find gamers →</Link>}</section>}
    </div>
  </main>;
}
