import test from 'node:test';
import assert from 'node:assert/strict';
import { getLoginDestination } from './authRedirect.js';

test('returns to the requested protected page, retaining query and anchor', () => {
  assert.equal(getLoginDestination({ from: { pathname: '/questionnaire', search: '?review=1', hash: '#results' } }), '/questionnaire?review=1#results');
  assert.equal(getLoginDestination({ from: { pathname: '/' } }), '/');
  assert.equal(getLoginDestination({ from: { pathname: '/gamematching' } }), '/gamematching');
});

test('direct login opens the dashboard and direct signup keeps its questionnaire fallback', () => {
  assert.equal(getLoginDestination(null), '/');
  assert.equal(getLoginDestination(undefined, '/questionnaire'), '/questionnaire');
});

test('untrusted redirect destinations and login loops use the safe fallback', () => {
  for (const pathname of ['https://example.com', '//example.com', '/\\example.com', '/login', '/signup', '/missing', '/questionnaire/../../login']) {
    assert.equal(getLoginDestination({ from: { pathname } }), '/');
  }
  assert.equal(getLoginDestination({ from: 'https://example.com' }), '/');
  assert.equal(getLoginDestination({ from: { pathname: '/questionnaire', search: '//example.com', hash: 'javascript:alert(1)' } }), '/questionnaire');
});
