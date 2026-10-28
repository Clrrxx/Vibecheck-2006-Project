import { acceptedFriends } from './friends';
import { useCallback, useEffect, useRef, useState } from 'react';

async function request(user, path, options = {}) {
  const token = await user.getIdToken();
  const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'Couldn’t reach connection notifications. Please try again.');
    error.status = response.status;
    throw error;
  }
  return body;
}

export default function useConnections(user) {
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const locked = useRef(false);
  const revision = useRef(0);
  const refresh = useCallback(async signal => {
    const version = ++revision.current;
    try {
      const body = await request(user, '/api/connections', { signal });
      if (!signal?.aborted && version === revision.current) { setConnections(body.connections || []); setError(''); }
    } catch (failure) {
      if (!signal?.aborted && version === revision.current) setError(failure.message);
    } finally {
      if (!signal?.aborted && version === revision.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    const initial = setTimeout(() => refresh(controller.signal), 0);
    const interval = setInterval(() => refresh(controller.signal), 10000);
    return () => { controller.abort(); clearTimeout(initial); clearInterval(interval); };
  }, [refresh]);

  async function act(path, body) {
    if (locked.current) return;
    locked.current = true;
    ++revision.current;
    setBusy(true);
    setError('');
    try {
      const result = await request(user, path, { method: 'POST', body: JSON.stringify(body || {}) });
      ++revision.current;
      setConnections(previous => [result.connection, ...previous.filter(record => record.id !== result.connection.id)]);
    } catch (failure) {
      if (failure.status === 409) await refresh();
      else setError(failure.message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return {
    connections, loading, error, busy, refresh,
    friends: acceptedFriends(connections, user.uid),
    connect: uid => act(`/api/connections/${encodeURIComponent(uid)}`),
    respond: (id, action) => act(`/api/connections/${encodeURIComponent(id)}/respond`, { action }),
    find: uid => connections.find(record => record.from === uid || record.to === uid),
    incoming: connections.filter(record => record.to === user.uid && record.status === 'pending'),
  };
}
