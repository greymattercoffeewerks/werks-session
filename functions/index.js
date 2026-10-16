const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { isAccountInviteEligible, isResourceEligible, personIdFor, requireAuth, requireRole } = require('./lib/authorization');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { createHash, randomUUID } = require('crypto');

initializeApp();
const db = getFirestore();
const resendKey = defineSecret('RESEND_API_KEY');
const region = 'asia-southeast1';

function validText(value, label, max = 240) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpsError('invalid-argument', `${label} is required.`);
  return value.trim();
}
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}
async function enforceInterestRateLimit(email, ip) {
  const key = createHash('sha256').update(`${email}|${ip || 'unknown'}`).digest('hex');
  const ref = db.collection('interest_rate_limits').doc(key);
  const now = Date.now();
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    const data = current.exists ? current.data() : null;
    const windowStartedAt = Number(data?.windowStartedAt || 0);
    const count = Number(data?.count || 0);
    if (windowStartedAt && now - windowStartedAt < 60 * 60 * 1000 && count >= 3) {
      throw new HttpsError('resource-exhausted', 'Please wait before submitting another interest request.');
    }
    transaction.set(ref, windowStartedAt && now - windowStartedAt < 60 * 60 * 1000
      ? { count: count + 1, updatedAt: FieldValue.serverTimestamp() }
      : { count: 1, windowStartedAt: now, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
}
async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) { console.info('Email not sent: RESEND_API_KEY is not configured.', { to, subject }); return; }
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Werks Sessions <sessions@greymatter.coffee>', to: [to], subject, html }) });
  if (!response.ok) console.error('Resend failed', await response.text());
}

exports.submitInterest = onCall({ region, secrets: [resendKey] }, async (request) => {
  const data = request.data || {};
  const offeringId = data.offeringId === 'cupping' || data.offeringId === 'brew101' ? data.offeringId : null;
  if (!offeringId) throw new HttpsError('invalid-argument', 'Choose a session.');
  const name = validText(data.name, 'Name');
  const email = validText(data.email, 'Email', 320).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpsError('invalid-argument', 'Enter a valid email address.');
  await enforceInterestRateLimit(email, request.rawRequest?.ip);
  const whatsapp = typeof data.whatsapp === 'string' ? data.whatsapp.trim().slice(0, 50) : '';
  const lead = { offeringId, name, email, whatsapp, marketingConsent: data.marketingConsent === true, status: 'interested', createdAt: FieldValue.serverTimestamp(), source: 'public_web' };
  await db.collection('interest_leads').add(lead);
  await sendEmail({ to: email, subject: 'You’re on the Werks Sessions interest list', html: `<p>Hi ${escapeHtml(name)},</p><p>Thanks for raising your hand for ${offeringId === 'cupping' ? 'Public Cupping' : 'Brew 101'}. We will be in touch when a table is ready.</p><p>— Grey Matter Coffee Werks</p>` });
  return { ok: true };
});

exports.activateLearner = onCall({ region }, async (request) => {
  const auth = requireAuth(request);
  const email = typeof auth.token.email === 'string' ? auth.token.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpsError('permission-denied', 'Use the email address invited by Werks Sessions.');
  const linkRef = db.collection('identity_links').doc(auth.uid);
  const inviteRef = db.collection('account_invites').doc(email);
  let identity = null;
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(linkRef);
    if (existing.exists) {
      identity = { personId: existing.data().personId, role: existing.data().role };
      return;
    }
    const invite = await transaction.get(inviteRef);
    if (!invite.exists || !isAccountInviteEligible(invite.data(), email)) {
      throw new HttpsError('permission-denied', 'This email does not have a confirmed Werks Sessions invitation.');
    }
    const personId = randomUUID();
    const role = 'learner';
    transaction.set(db.collection('people').doc(personId), { personId, email: auth.token.email || '', displayName: auth.token.name || '', createdAt: FieldValue.serverTimestamp(), status: 'active' });
    transaction.set(linkRef, { provider: 'firebase', providerSubject: auth.uid, personId, role, createdAt: FieldValue.serverTimestamp() });
    transaction.update(inviteRef, { status: 'claimed', personId, claimedAt: FieldValue.serverTimestamp() });
    identity = { personId, role };
  });
  await getAuth().setCustomUserClaims(auth.uid, { person_id: identity.personId, role: identity.role });
  return { ...identity, refreshRequired: true };
});

exports.confirmEnrolment = onCall({ region }, async (request) => {
  requireRole(request, ['admin']);
  const { sessionId, enrolmentId } = request.data || {};
  validText(sessionId, 'Session'); validText(enrolmentId, 'Enrolment');
  await db.runTransaction(async (transaction) => {
    const sessionRef = db.collection('sessions').doc(sessionId);
    const enrolmentRef = db.collection('enrolments').doc(enrolmentId);
    const [session, enrolment] = await Promise.all([transaction.get(sessionRef), transaction.get(enrolmentRef)]);
    if (!session.exists || !enrolment.exists) throw new HttpsError('not-found', 'Session or enrolment was not found.');
    const data = session.data();
    if (data.confirmedSeats >= data.capacity) throw new HttpsError('failed-precondition', 'This session is full.');
    if (enrolment.data().status === 'confirmed') return;
    transaction.update(enrolmentRef, { status: 'confirmed', confirmedAt: FieldValue.serverTimestamp() });
    transaction.update(sessionRef, { confirmedSeats: FieldValue.increment(1) });
  });
  return { ok: true };
});

exports.recordAttendance = onCall({ region }, async (request) => {
  const auth = requireRole(request, ['admin', 'instructor']);
  const { enrolmentId, attended } = request.data || {};
  validText(enrolmentId, 'Enrolment');
  if (typeof attended !== 'boolean') throw new HttpsError('invalid-argument', 'Attendance is required.');
  const enrolmentRef = db.collection('enrolments').doc(enrolmentId);
  const enrolment = await enrolmentRef.get();
  if (!enrolment.exists) throw new HttpsError('not-found', 'Enrolment not found.');
  const data = enrolment.data();
  await enrolmentRef.update({ status: attended ? 'attended' : 'no_show', attendanceRecordedBy: personIdFor(auth), attendanceRecordedAt: FieldValue.serverTimestamp() });
  if (attended) await db.collection('learning_records').add({ personId: data.personId, sessionId: data.sessionId, type: 'attended', title: data.offeringTitle || 'Werks Sessions', issuer: 'Grey Matter Coffee Werks', issuedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

exports.submitChallenge = onCall({ region }, async (request) => {
  const auth = requireRole(request, ['learner']); const personId = personIdFor(auth);
  const enrolments = await db.collection('enrolments').where('personId', '==', personId).get();
  const attendedBrew101 = enrolments.docs.some((document) => {
    const enrolment = document.data();
    return enrolment.offeringId === 'brew101' && enrolment.status === 'attended';
  });
  if (!attendedBrew101) throw new HttpsError('failed-precondition', 'Attend Brew 101 before submitting your practice card.');
  const weeks = request.data?.weeks;
  if (!Array.isArray(weeks) || weeks.length !== 4 || weeks.some((week) => !week.complete || !week.coffee || !week.recipe || !week.tastingNote || !week.changeMade)) throw new HttpsError('failed-precondition', 'Complete all four practice weeks before submitting.');
  await db.collection('challenges').doc(personId).set({ personId, weeks, status: 'submitted', submittedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true };
});

exports.reviewChallenge = onCall({ region }, async (request) => {
  const auth = requireRole(request, ['admin', 'instructor']);
  const { personId, approved, note = '' } = request.data || {};
  validText(personId, 'Learner'); if (typeof approved !== 'boolean') throw new HttpsError('invalid-argument', 'Review decision is required.');
  await db.collection('challenges').doc(personId).set({ status: approved ? 'approved' : 'returned', reviewerNote: String(note).slice(0, 1200), reviewedBy: personIdFor(auth), reviewedAt: FieldValue.serverTimestamp() }, { merge: true });
  if (approved) await db.collection('learning_records').add({ personId, type: 'challenge_complete', title: 'Brew 101 · 30-day practice complete', issuer: 'Grey Matter Coffee Werks', issuedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

/**
 * Resource documents live in `learning_resources` and are private. Expected shape:
 * { offeringId, title, description, format, status: 'published', storagePath, updatedAt }
 * The client receives only an expiring Storage URL after its enrolment is eligible.
 */
exports.listMyLearningResources = onCall({ region }, async (request) => {
  const auth = requireAuth(request);
  const personId = personIdFor(auth);
  const enrolmentSnapshot = await db.collection('enrolments').where('personId', '==', personId).get();
  const allowedOfferings = new Set(enrolmentSnapshot.docs
    .map((doc) => doc.data())
    .filter(isResourceEligible)
    .map((enrolment) => enrolment.offeringId));
  if (!allowedOfferings.size) return { resources: [] };

  const resourcesSnapshot = await db.collection('learning_resources').where('status', '==', 'published').get();
  const resources = await Promise.all(resourcesSnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((resource) => allowedOfferings.has(resource.offeringId) && typeof resource.storagePath === 'string')
    .map(async (resource) => {
      const [downloadUrl] = await getStorage().bucket().file(resource.storagePath).getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 });
      return { id: resource.id, title: resource.title, description: resource.description || '', format: resource.format || 'guide', updatedAt: resource.updatedAt || '', downloadUrl };
    }));
  return { resources };
});
