const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { isResourceEligible, personIdFor, requireAuth, requireRole } = require('./lib/authorization');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { randomUUID } = require('crypto');

initializeApp();
const db = getFirestore();
const resendKey = defineSecret('RESEND_API_KEY');
const region = 'asia-southeast1';

function validText(value, label, max = 240) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpsError('invalid-argument', `${label} is required.`);
  return value.trim();
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
  const whatsapp = typeof data.whatsapp === 'string' ? data.whatsapp.trim().slice(0, 50) : '';
  const lead = { offeringId, name, email, whatsapp, marketingConsent: data.marketingConsent === true, status: 'interested', createdAt: FieldValue.serverTimestamp(), source: 'public_web' };
  await db.collection('interest_leads').add(lead);
  await sendEmail({ to: email, subject: 'You’re on the Werks Sessions interest list', html: `<p>Hi ${name},</p><p>Thanks for raising your hand for ${offeringId === 'cupping' ? 'Public Cupping' : 'Brew 101'}. We will be in touch when a table is ready.</p><p>— Grey Matter Coffee Werks</p>` });
  return { ok: true };
});

exports.activateLearner = onCall({ region }, async (request) => {
  const auth = requireAuth(request);
  const linkRef = db.collection('identity_links').doc(auth.uid);
  const existing = await linkRef.get();
  if (existing.exists) return { personId: existing.data().personId, role: existing.data().role };
  const personId = randomUUID();
  const role = 'learner';
  await db.runTransaction(async (transaction) => {
    transaction.set(db.collection('people').doc(personId), { personId, email: auth.token.email || '', displayName: auth.token.name || '', createdAt: FieldValue.serverTimestamp(), status: 'active' });
    transaction.set(linkRef, { provider: 'firebase', providerSubject: auth.uid, personId, role, createdAt: FieldValue.serverTimestamp() });
  });
  await getAuth().setCustomUserClaims(auth.uid, { person_id: personId, role });
  return { personId, role, refreshRequired: true };
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
  const auth = requireAuth(request); const personId = personIdFor(auth);
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
