const assert = require('node:assert/strict');
const test = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const { isAccountInviteEligible, isResourceEligible, personIdFor, requireRole } = require('../lib/authorization');

test('rejects unauthenticated and unauthorized callable requests', () => {
  assert.throws(() => requireRole({ auth: null }, ['admin']), HttpsError);
  assert.throws(() => requireRole({ auth: { token: { role: 'learner' } } }, ['admin']), HttpsError);
});

test('permits configured roles and preserves provider-neutral identifiers', () => {
  const auth = { uid: 'firebase-subject', token: { role: 'instructor', person_id: 'person-123' } };
  assert.equal(requireRole({ auth }, ['admin', 'instructor']), auth);
  assert.equal(personIdFor(auth), 'person-123');
  assert.throws(() => personIdFor({ uid: 'firebase-subject', token: {} }), HttpsError);
});

test('allows resources only for eligible enrolments', () => {
  assert.equal(isResourceEligible({ status: 'confirmed', paymentStatus: 'pending' }), true);
  assert.equal(isResourceEligible({ status: 'invited', paymentStatus: 'paid' }), true);
  assert.equal(isResourceEligible({ status: 'invited', paymentStatus: 'pending' }), false);
});

test('requires a staff-created learner invitation before activation', () => {
  assert.equal(isAccountInviteEligible({ status: 'ready', role: 'learner', email: 'maya@example.com' }, 'maya@example.com'), true);
  assert.equal(isAccountInviteEligible({ status: 'ready', role: 'learner', email: 'maya@example.com' }, 'other@example.com'), false);
  assert.equal(isAccountInviteEligible({ status: 'claimed', role: 'learner', email: 'maya@example.com' }, 'maya@example.com'), false);
  assert.equal(isAccountInviteEligible({ status: 'ready', role: 'admin', email: 'maya@example.com' }, 'maya@example.com'), false);
});
