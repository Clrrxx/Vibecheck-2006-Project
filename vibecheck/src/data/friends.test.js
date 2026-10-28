import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptedFriends } from './friends.js';
test('accepted connections appear in both players’ lists and pending/declined connections stay out', () => {
  const accepted = { from: 'a', to: 'b', fromName: 'Alice', toName: 'Bob', status: 'accepted', updatedAt: 123 };
  const records = [accepted, { ...accepted, to: 'c', status: 'pending' }, { ...accepted, to: 'd', status: 'declined' }];
  assert.deepEqual(acceptedFriends(records, 'a'), [{ id: 'b', name: 'Bob', connectedAt: 123 }]);
  assert.deepEqual(acceptedFriends(records, 'b'), [{ id: 'a', name: 'Alice', connectedAt: 123 }]);
  assert.deepEqual(acceptedFriends(records, 'unrelated'), []);
});
