import { createHash } from 'node:crypto';

export function connectionKey(first, second) {
  return createHash('sha256').update(JSON.stringify([first, second].sort())).digest('hex');
}

export function validGamerId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && !/[.#$\[\]/\u0000-\u001f\u007f]/.test(value);
}

export function newConnection(current, from, to, fromName, toName, now) {
  // A pair has one record, even when both players click Connect simultaneously.
  if (current) return;
  return { from, to, fromName, toName, status: 'pending', createdAt: now, updatedAt: now };
}

export function respondToConnection(current, uid, action, now) {
  if (!current || current.to !== uid || !['accept', 'decline'].includes(action)) return;
  const status = action === 'accept' ? 'accepted' : 'declined';
  if (current.status === status) return current;
  if (current.status !== 'pending') return;
  return { ...current, status, updatedAt: now };
}

// Older deployments may not have the optional from/to query indexes yet.
// Keep the fallback on the admin server and filter before returning any records.
export async function loadUserConnections(db, uid) {
  const records = db.ref('gamerConnections');
  try {
    const [sent, received] = await Promise.all([
      records.orderByChild('from').equalTo(uid).get(),
      records.orderByChild('to').equalTo(uid).get(),
    ]);
    return { ...sent.val(), ...received.val() };
  } catch (error) {
    if (!/Index not defined/i.test(error.message || '')) throw error;
    const snapshot = await records.get();
    return Object.fromEntries(Object.entries(snapshot.val() || {})
      .filter(([, record]) => record.from === uid || record.to === uid));
  }
}

export function registerConnectionRoutes(app, db, requireUser) {
  app.get('/api/connections', requireUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const [records, blocked] = await Promise.all([
        loadUserConnections(db, req.uid),
        db.ref(`users/${req.uid}/blockedGamers`).get(),
      ]);
      const connections = Object.entries(records).map(([id, record]) => ({ ...record, id }))
        .filter(record => !blocked.val()?.[record.from === req.uid ? record.to : record.from])
        .sort((a, b) => b.updatedAt - a.updatedAt);
      res.json({ connections });
    } catch (error) {
      console.error('Loading connections failed:', error);
      res.status(500).json({ error: 'Couldn’t load connection notifications. Please try again.' });
    }
  });

  app.post('/api/connections/:uid', requireUser, async (req, res) => {
    const to = req.params.uid;
    if (!validGamerId(to) || to === req.uid) return res.status(400).json({ error: 'Choose another gamer to connect with.' });
    try {
      const [sender, recipient] = await Promise.all([db.ref(`users/${req.uid}`).get(), db.ref(`users/${to}`).get()]);
      if (!sender.child('questResults/latest').exists() || !recipient.child('questResults/latest').exists()) return res.status(404).json({ error: 'Both gamers need a saved assessment to connect.' });
      if (sender.child(`blockedGamers/${to}`).val() || recipient.child(`blockedGamers/${req.uid}`).val()) return res.status(403).json({ error: 'This gamer is unavailable for connections.' });
      const now = Date.now();
      const result = await db.ref(`gamerConnections/${connectionKey(req.uid, to)}`).transaction(current =>
        newConnection(current, req.uid, to, sender.child('questResults/latest/name').val() || 'Adventurer', recipient.child('questResults/latest/name').val() || 'Adventurer', now));
      res.json({ connection: { ...result.snapshot.val(), id: connectionKey(req.uid, to) } });
    } catch (error) {
      console.error('Connection request failed:', error);
      res.status(500).json({ error: 'Couldn’t send your connection request. Please try again.' });
    }
  });

  app.post('/api/connections/:id/respond', requireUser, async (req, res) => {
    const { id } = req.params;
    const { action } = req.body || {};
    if (!/^[a-f0-9]{64}$/.test(id) || !['accept', 'decline'].includes(action)) return res.status(400).json({ error: 'Invalid connection response.' });
    try {
      const record = db.ref(`gamerConnections/${id}`);
      const initial = (await record.get()).val();
      if (!initial || initial.to !== req.uid) return res.status(403).json({ error: 'Only the recipient can respond to this request.' });
      const [a, b] = await Promise.all([db.ref(`users/${req.uid}/blockedGamers/${initial.from}`).get(), db.ref(`users/${initial.from}/blockedGamers/${req.uid}`).get()]);
      if (a.val() || b.val()) return res.status(403).json({ error: 'This gamer is unavailable for connections.' });
      const now = Date.now();
      // Admin transaction callbacks can first receive null before the server value is loaded.
      // Propose null to allow the server to retry with the existing record instead of aborting.
      const result = await record.transaction(current => current === null ? null : respondToConnection(current, req.uid, action, now));
      if (!result.committed) return res.status(409).json({ error: 'This request has already been answered. Refresh your notifications.' });
      res.json({ connection: { ...result.snapshot.val(), id } });
    } catch (error) {
      console.error('Connection response failed:', error);
      res.status(500).json({ error: 'Couldn’t respond to the connection request. Please try again.' });
    }
  });
}
