const assert = require('node:assert/strict');
const test = require('node:test');
const { HttpsError } = require('firebase-functions/v2/https');
const { isResourceEligible, personIdFor, requireRole } = require('../lib/authorization');

test('rejects unauthenticated and unauthorized callable requests', () => {
  assert.throws(() => requireRole({ auth: null }, ['admin']), HttpsError);
  assert.throws(() => requireRole({ auth: { token: { role: 'learner' } } }, ['admin']), HttpsError);
});

test('permits configured roles and preserves provider-neutral identifiers', () => {
  const auth = { uid: 'firebase-subject', token: { role: 'instructor', person_id: 'person-123' } };
  assert.equal(requireRole({ auth }, ['admin', 'instructor']), auth);
  assert.equal(personIdFor(auth), 'person-123');
  assert.equal(personIdFor({ uid: 'firebase-subject', token: {} }), 'firebase-subject');
});

test('allows resources only for eligible enrolments', () => {
  assert.equal(isResourceEligible({ status: 'confirmed', paymentStatus: 'pending' }), true);
  assert.equal(isResourceEligible({ status: 'invited', paymentStatus: 'paid' }), true);
  assert.equal(isResourceEligible({ status: 'invited', paymentStatus: 'pending' }), false);
});
