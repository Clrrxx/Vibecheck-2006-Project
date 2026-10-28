import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import './GamerMatching.css';
import './Messages.css';

async function chatRequest(user, path, options = {}) {
  const token = await user.getIdToken();
  const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'Couldn’t reach messages. Please try again.');
    error.status = response.status;
    throw error;
  }
  return body;
}
const merge = (previous, next) => [...new Map([...previous, ...next].map(message => [message.id, message])).values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

function Conversation({ user, uid }) {
  const [chat, setChat] = useState({ messages: [], name: 'Your friend', loading: true, hasMore: false, denied: false });
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const locked = useRef(false);
  const retry = useRef(null);
  const scroll = useRef(null);
  const nearBottom = useRef(true);
  const endpoint = `/api/messages/${encodeURIComponent(uid)}`;
  const load = useCallback(async signal => {
    try {
      const body = await chatRequest(user, endpoint, { signal });
      if (signal?.aborted) return;
      setChat(previous => ({ ...previous, name: body.name, messages: merge(previous.messages, body.messages), loading: false, denied: false, hasMore: previous.messages.length > 50 ? previous.hasMore : body.hasMore }));
      setError('');
    } catch (failure) {
      if (signal?.aborted) return;
      setError(failure.message);
      setChat(previous => ({ ...previous, loading: false, denied: failure.status === 403, messages: failure.status === 403 ? [] : previous.messages }));
    }
  }, [endpoint, user]);

  useEffect(() => {
    const controller = new AbortController();
    const initial = setTimeout(() => load(controller.signal), 0);
    const interval = setInterval(() => load(controller.signal), 3000);
    return () => { controller.abort(); clearTimeout(initial); clearInterval(interval); };
  }, [load]);

  const lastId = chat.messages.at(-1)?.id;
  useEffect(() => {
    if (nearBottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [lastId]);

  async function send(event) {
    event.preventDefault();
    if (locked.current || !draft.trim() || chat.denied) return;
    locked.current = true;
    setSending(true);
    setError('');
    if (!retry.current || retry.current.text !== draft) retry.current = { text: draft, clientId: crypto.randomUUID() };
    try {
      const result = await chatRequest(user, endpoint, { method: 'POST', body: JSON.stringify(retry.current) });
      nearBottom.current = true;
      setChat(previous => ({ ...previous, messages: merge(previous.messages, [result.message]) }));
      setDraft('');
      retry.current = null;
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 403) setChat(previous => ({ ...previous, denied: true, messages: [] }));
    } finally {
      locked.current = false;
      setSending(false);
    }
  }

  async function older() {
    if (loadingOlder || !chat.messages.length) return;
    setLoadingOlder(true);
    const container = scroll.current;
    const previousHeight = container?.scrollHeight || 0;
    try {
      const body = await chatRequest(user, `${endpoint}?before=${encodeURIComponent(chat.messages[0].id)}`);
      nearBottom.current = false;
      setChat(previous => ({ ...previous, messages: merge(body.messages, previous.messages), hasMore: body.hasMore }));
      requestAnimationFrame(() => { if (container) container.scrollTop += container.scrollHeight - previousHeight; });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  return <section className="chat-panel" aria-label={`Conversation with ${chat.name}`}>
    <header className="chat-heading"><span className="chat-avatar" aria-hidden="true">{chat.name.charAt(0).toUpperCase()}</span><div><h1>{chat.name}</h1><p>Private conversation · Updates every 3 seconds</p></div></header>
    {error && <p className="chat-error" role="alert">{error} <button onClick={() => load()}>Retry</button></p>}
    <div className="chat-history" ref={scroll} onScroll={event => { const el = event.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
      {chat.loading ? <p role="status">Loading your conversation…</p> : chat.denied ? <p>Return to Friends to choose an available connection.</p> : <>
        {chat.hasMore && <button className="players-secondary chat-older" disabled={loadingOlder} onClick={older}>{loadingOlder ? 'Loading…' : 'Load earlier messages'}</button>}
        {!chat.messages.length && <p className="chat-empty">Your adventure together starts with a hello.<br />Send your first message to {chat.name}.</p>}
        <ol aria-label="Messages">{chat.messages.map(message => <li className={message.sender === user.uid ? 'chat-message mine' : 'chat-message'} key={message.id}><span className="chat-sender">{message.sender === user.uid ? 'You' : chat.name}</span><p>{message.text}</p><time dateTime={new Date(message.createdAt).toISOString()}>{new Date(message.createdAt).toLocaleString()}</time></li>)}</ol>
      </>}
    </div>
    <form className="chat-compose" onSubmit={send}><label htmlFor="chat-draft">Message {chat.name}</label><div><textarea id="chat-draft" placeholder="Say hello…" maxLength={2000} rows={3} value={draft} disabled={sending || chat.denied || chat.loading} onChange={event => setDraft(event.target.value)} /><button disabled={sending || chat.denied || chat.loading || !draft.trim()}>{sending ? 'Sending…' : 'Send →'}</button></div><small>{draft.length}/2000 · Your messages are saved to this conversation.</small></form>
  </section>;
}

export default function Messages() {
  const user = useOutletContext();
  const { uid } = useParams();
  return <main className="players-page"><header className="players-topbar"><Link to="/" className="players-brand">◉ vibecheck</Link><Link to="/friends">← Back to friends</Link></header><div className="chat-content"><Conversation key={uid} user={user} uid={uid} /></div></main>;
}
