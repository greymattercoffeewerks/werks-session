const { HttpsError } = require('firebase-functions/v2/https');

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in to continue.');
  return request.auth;
}

function requireRole(request, roles) {
  const auth = requireAuth(request);
  if (!roles.includes(auth.token.role)) throw new HttpsError('permission-denied', 'You do not have access to this action.');
  return auth;
}

function personIdFor(auth) {
  return auth.token.person_id || auth.uid;
}

function isResourceEligible(enrolment) {
  return ['confirmed', 'attended'].includes(enrolment.status) || ['deposit_paid', 'paid'].includes(enrolment.paymentStatus);
}

module.exports = { isResourceEligible, personIdFor, requireAuth, requireRole };
