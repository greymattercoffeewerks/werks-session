const { HttpsError } = require('firebase-functions/v2/https');

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please sign in to continue.');
  return request.auth;
}

function requireRole(request, roles) {
  const auth = requireAuth(request);
  if (!roles.includes(auth.token.role)) throw new HttpsError('permission-denied', 'You do not have access to this action.');
  personIdFor(auth);
  return auth;
}

function personIdFor(auth) {
  if (typeof auth?.token?.person_id !== 'string' || !auth.token.person_id) {
    throw new HttpsError('permission-denied', 'Your account is not ready for this action.');
  }
  return auth.token.person_id;
}

function isResourceEligible(enrolment) {
  return ['confirmed', 'attended'].includes(enrolment.status) || ['deposit_paid', 'paid'].includes(enrolment.paymentStatus);
}

function isAccountInviteEligible(invite, email) {
  return Boolean(invite
    && invite.status === 'ready'
    && invite.role === 'learner'
    && typeof invite.email === 'string'
    && invite.email.trim().toLowerCase() === email);
}

module.exports = { isAccountInviteEligible, isResourceEligible, personIdFor, requireAuth, requireRole };
