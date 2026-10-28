import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ConnectionNotifications.css';

export default function ConnectionNotifications({ user, state }) {
  const [open, setOpen] = useState(false);
  return <div className="connection-notifications">
    <button type="button" className="connection-bell" aria-label={`Connection notifications${state.incoming.length ? `, ${state.incoming.length} pending` : ''}`} aria-expanded={open} onClick={() => setOpen(value => !value)}>♧ <span>Notifications</span>{state.incoming.length > 0 && <b>{state.incoming.length}</b>}</button>
    {open && <section className="connection-inbox" aria-label="Connection notifications"><div className="connection-inbox-heading"><h2>Connections</h2><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}>×</button></div>
      <Link className="connection-friends-link" to="/friends" onClick={() => setOpen(false)}>View friends ({state.friends.length}) →</Link>
      {state.loading && <p role="status">Loading notifications…</p>}
      {state.error && <p role="alert">{state.error} <button onClick={() => state.refresh()}>Retry</button></p>}
      {!state.loading && !state.error && !state.connections.length && <p>No connection requests yet.</p>}
      {state.connections.filter(record => record.status !== 'declined').map(record => {
        const incoming = record.to === user.uid;
        const name = incoming ? record.fromName : record.toName;
        return <article key={record.id}><p><strong>{name}</strong>{record.status === 'accepted' ? ' is now connected with you.' : incoming ? ' wants to connect with you.' : ' — your connection request is pending.'}</p><small>{new Date(record.updatedAt).toLocaleString()}</small>{incoming && record.status === 'pending' && <div className="connection-actions"><button disabled={state.busy} onClick={() => state.respond(record.id, 'accept')}>Accept</button><button disabled={state.busy} onClick={() => state.respond(record.id, 'decline')}>Decline</button></div>}</article>;
      })}
      {!state.loading && state.connections.length > 0 && state.connections.every(record => record.status === 'declined') && <p>No pending connections.</p>}
    </section>}
    {!open && state.error && <span className="connection-error" role="alert">Notifications unavailable</span>}
    <span className="connection-live" role="status" aria-live="polite">{state.incoming.length ? `${state.incoming.length} incoming connection requests` : ''}</span>
  </div>;
}
