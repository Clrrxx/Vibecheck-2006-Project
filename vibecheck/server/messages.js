import { connectionKey, validGamerId } from './connections.js';

export function validateMessage(input) {
  if (typeof input?.text !== 'string' || !input.text.trim() || input.text.length > 2000) return 'Enter a message between 1 and 2,000 characters.';
  if (typeof input?.clientId !== 'string' || !/^[a-f0-9-]{36}$/.test(input.clientId)) return 'Invalid message identifier.';
  return null;
}

export async function requireFriendship(db, uid, other) {
  if (!validGamerId(other) || other === uid) return null;
  const pair = connectionKey(uid, other);
  const [connection, blockedByMe, blockedByThem] = await Promise.all([
    db.ref(`gamerConnections/${pair}`).get(),
    db.ref(`users/${uid}/blockedGamers/${other}`).get(),
    db.ref(`users/${other}/blockedGamers/${uid}`).get(),
  ]);
  const record = connection.val();
  if (!record || record.status !== 'accepted' || ![record.from, record.to].includes(uid) || ![record.from, record.to].includes(other) || blockedByMe.val() || blockedByThem.val()) return null;
  return { pair, name: record.from === uid ? record.toName : record.fromName };
}

export function registerMessageRoutes(app, db, requireUser) {
  app.get('/api/messages/:uid', requireUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const before = req.query?.before;
    if (before !== undefined && (typeof before !== 'string' || !/^[-_A-Za-z0-9]{20}$/.test(before))) return res.status(400).json({ error: 'Invalid message cursor.' });
    try {
      const friend = await requireFriendship(db, req.uid, req.params.uid);
      if (!friend) return res.status(403).json({ error: 'Messaging is only available between connected, unblocked friends.' });
      let query = db.ref(`gamerMessages/${friend.pair}`).orderByKey();
      if (before) query = query.endBefore(before);
      const snapshot = await query.limitToLast(51).get();
      const records = Object.entries(snapshot.val() || {}).map(([id, message]) => ({ ...message, id })).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      res.json({ name: friend.name || 'Adventurer', messages: records.slice(-50), hasMore: records.length > 50 });
    } catch (error) {
      console.error('Loading messages failed:', error);
      res.status(500).json({ error: 'Couldn’t load messages. Please try again.' });
    }
  });

  app.post('/api/messages/:uid', requireUser, async (req, res) => {
    const invalid = validateMessage(req.body);
    if (invalid) return res.status(400).json({ error: invalid });
    try {
      const friend = await requireFriendship(db, req.uid, req.params.uid);
      if (!friend) return res.status(403).json({ error: 'Messaging is only available between connected, unblocked friends.' });
      const messages = db.ref(`gamerMessages/${friend.pair}`);
      const candidate = { id: messages.push().key, sender: req.uid, text: req.body.text.trim(), createdAt: Date.now() };
      // Reserve a stable message ID per sender/retry token, so a network retry cannot send twice.
      const reservation = db.ref(`gamerMessageRequests/${friend.pair}/${req.uid}/${req.body.clientId}`);
      const result = await reservation.transaction(current => current || candidate);
      const message = result.snapshot.val();
      if (message.text !== candidate.text) return res.status(409).json({ error: 'This message identifier has already been used. Please compose a new message.' });
      await messages.child(message.id).set(message);
      res.json({ message });
    } catch (error) {
      console.error('Sending message failed:', error);
      res.status(500).json({ error: 'Couldn’t send your message. Your draft is kept so you can retry.' });
    }
  });
}
