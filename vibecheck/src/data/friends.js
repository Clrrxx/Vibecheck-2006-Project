// Accepted connections are the shared source for both players' friend lists.
export function acceptedFriends(connections, uid) {
  return connections.filter(record => record.status === 'accepted' && (record.from === uid || record.to === uid))
    .map(record => ({
      id: record.from === uid ? record.to : record.from,
      name: (record.from === uid ? record.toName : record.fromName) || 'Adventurer',
      connectedAt: record.updatedAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
