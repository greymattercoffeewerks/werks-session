const { readFileSync } = require('node:fs');
const { after, before, describe, test } = require('node:test');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const { serverTimestamp } = require('firebase/firestore');

let testEnv;

const draftWeeks = {
  week1: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
  week2: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
  week3: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
  week4: { focus: '', coffee: '', recipe: '', tastingNote: '', changeMade: '', complete: false, status: 'draft' },
};

const submittedWeek1 = {
  ...draftWeeks,
  week1: { focus: 'Ratio', coffee: 'ttku', recipe: '15g : 250g', tastingNote: 'Sweeter at 1:16.', changeMade: 'Held grind steady.', complete: true, status: 'submitted' },
};

const challenge = (overrides = {}) => ({
  sessionId: 'brew101-01',
  ownerUid: 'learner-uid',
  personId: 'person-123',
  status: 'in_progress',
  weeks: draftWeeks,
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
  ...overrides,
});

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-werks-sessions',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.doc('courses/brew101').set({ title: 'Brew 101' });
    await db.doc('sessions/brew101-01').set({ title: 'Manual Brew Foundations' });
    await db.doc('people/person-123').set({ personId: 'person-123', email: 'maya@example.com' });
    await db.doc('learning_records/record-123').set({ personId: 'person-123' });
    await db.doc('access_grants/learner-uid').set({ personId: 'person-123', role: 'learner', status: 'active' });
    await db.doc('access_grants/instructor-uid').set({ personId: 'person-456', role: 'instructor', status: 'active' });
    await db.doc('access_grants/unassigned-instructor-uid').set({ personId: 'person-789', role: 'instructor', status: 'active' });
    await db.doc('enrolments/brew101-01_learner-uid').set({ sessionId: 'brew101-01', uid: 'learner-uid', personId: 'person-123', status: 'confirmed' });
    await db.doc('enrolments/brew101-02_learner-uid').set({ sessionId: 'brew101-02', uid: 'learner-uid', personId: 'person-123', status: 'confirmed' });
    await db.doc('enrolments/brew101-pending_learner-uid').set({ sessionId: 'brew101-pending', uid: 'learner-uid', personId: 'person-123', status: 'pending' });
    await db.doc('teaching_assignments/brew101-01_instructor-uid').set({ sessionId: 'brew101-01', uid: 'instructor-uid', status: 'active' });
    await db.doc('sessions/brew101-01/challenges/learner-uid').set(challenge());
  });
});

after(async () => testEnv.cleanup());

describe('Spark access grants and learner practice', () => {
  test('allows a manually granted learner to read only their own records', async () => {
    const db = testEnv.authenticatedContext('learner-uid').firestore();
    await assertSucceeds(db.doc('access_grants/learner-uid').get());
    await assertSucceeds(db.doc('people/person-123').get());
    await assertSucceeds(db.doc('sessions/brew101-01').get());
    await assertSucceeds(db.doc('sessions/brew101-01/challenges/learner-uid').get());
    await assertFails(db.doc('enrolments/brew101-pending_learner-uid').get());
    await assertSucceeds(db.collection('enrolments')
      .where('uid', '==', 'learner-uid')
      .where('personId', '==', 'person-123')
      .where('status', '==', 'confirmed')
      .get());
    await assertFails(db.collection('enrolments').where('uid', '==', 'learner-uid').get());
    await assertFails(db.doc('access_grants/instructor-uid').get());
    await assertFails(db.doc('people/person-456').get());
  });

  test('allows a confirmed learner to submit each complete week and locks that week', async () => {
    const db = testEnv.authenticatedContext('learner-uid').firestore();
    const draft = challenge({ sessionId: 'brew101-02', status: 'in_progress' });
    await assertSucceeds(db.doc('sessions/brew101-02/challenges/learner-uid').set(draft));
    await assertFails(db.doc('sessions/brew101-01/challenges/learner-uid').update({ status: 'submitted', submittedAt: '2026-10-16T00:30:00.000Z' }));
    await assertFails(db.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: { ...draftWeeks, week1: { ...draftWeeks.week1, status: 'submitted' } } }));
    await assertSucceeds(db.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: submittedWeek1 }));
    await assertSucceeds(db.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: { ...submittedWeek1, week2: { ...submittedWeek1.week2, focus: 'Grind' } } }));
    await assertFails(db.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: { ...submittedWeek1, week1: { ...submittedWeek1.week1, focus: 'Changed after submission' } } }));
    await assertFails(db.doc('sessions/brew101-01/challenges/learner-uid').update({ reviewerNote: 'Self-approved' }));
    await assertFails(db.doc('access_grants/learner-uid').set({ personId: 'person-123', role: 'admin', status: 'active' }));
  });

  test('allows only the assigned instructor to review one submitted week at a time', async () => {
    const instructor = testEnv.authenticatedContext('instructor-uid').firestore();
    const learner = testEnv.authenticatedContext('learner-uid').firestore();
    const unassigned = testEnv.authenticatedContext('unassigned-instructor-uid').firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: submittedWeek1 });
    });
    await assertSucceeds(instructor.doc('sessions/brew101-01/challenges/learner-uid').get());
    await assertSucceeds(instructor.collection('teaching_assignments').where('uid', '==', 'instructor-uid').where('status', '==', 'active').get());
    const returnedWeek1 = {
      ...submittedWeek1,
      week1: { ...submittedWeek1.week1, status: 'returned', reviewerNote: 'Try the same ratio once more and compare the sweetness.', reviewedAt: serverTimestamp() },
    };
    await assertSucceeds(instructor.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: returnedWeek1, updatedAt: serverTimestamp() }));
    const storedReturnedWeek1 = (await instructor.doc('sessions/brew101-01/challenges/learner-uid').get()).data().weeks;
    const resubmittedWeek1 = {
      ...storedReturnedWeek1,
      week1: { ...storedReturnedWeek1.week1, status: 'submitted' },
    };
    await assertSucceeds(learner.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: resubmittedWeek1 }));
    const approvedWeek1 = {
      ...resubmittedWeek1,
      week1: { ...resubmittedWeek1.week1, status: 'approved', reviewerNote: 'Clear observation and a useful next change.', reviewedAt: serverTimestamp() },
    };
    await assertSucceeds(instructor.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: approvedWeek1, updatedAt: serverTimestamp() }));
    await assertFails(instructor.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: { ...approvedWeek1, week1: { ...approvedWeek1.week1, reviewerNote: 'Changed after approval.' } }, updatedAt: serverTimestamp() }));
    await assertFails(instructor.doc('teaching_assignments/brew101-01_instructor-uid').set({ status: 'active' }));
    await assertFails(unassigned.doc('sessions/brew101-01/challenges/learner-uid').get());
  });

  test('requires the server review timestamp on every instructor review', async () => {
    const instructor = testEnv.authenticatedContext('instructor-uid').firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('enrolments/brew101-04_learner-uid').set({ sessionId: 'brew101-04', uid: 'learner-uid', personId: 'person-123', status: 'confirmed' });
      await db.doc('teaching_assignments/brew101-04_instructor-uid').set({ sessionId: 'brew101-04', uid: 'instructor-uid', status: 'active' });
      await db.doc('sessions/brew101-04/challenges/learner-uid').set(challenge({ sessionId: 'brew101-04', weeks: submittedWeek1 }));
    });
    const reviewed = { ...submittedWeek1.week1, status: 'returned', reviewerNote: 'Compare the sweetness once more.' };
    await assertFails(instructor.doc('sessions/brew101-04/challenges/learner-uid').update({ weeks: { ...submittedWeek1, week1: reviewed }, updatedAt: serverTimestamp() }));
    await assertFails(instructor.doc('sessions/brew101-04/challenges/learner-uid').update({ weeks: { ...submittedWeek1, week1: { ...reviewed, reviewedAt: new Date('2020-01-01T00:00:00Z') } }, updatedAt: serverTimestamp() }));
    await assertSucceeds(instructor.doc('sessions/brew101-04/challenges/learner-uid').update({ weeks: { ...submittedWeek1, week1: { ...reviewed, reviewedAt: serverTimestamp() } }, updatedAt: serverTimestamp() }));
  });

  test('allows a learner to save edits to all four weeks in one write', async () => {
    const learner = testEnv.authenticatedContext('learner-uid').firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('enrolments/brew101-05_learner-uid').set({ sessionId: 'brew101-05', uid: 'learner-uid', personId: 'person-123', status: 'confirmed' });
      await db.doc('sessions/brew101-05/challenges/learner-uid').set(challenge({ sessionId: 'brew101-05' }));
    });
    const filled = (label) => ({ focus: `${label} focus`, coffee: `${label} coffee`, recipe: '15 g : 250 g', tastingNote: `${label} note`, changeMade: `${label} change`, complete: true, status: 'draft' });
    const allWeeksEdited = { week1: filled('One'), week2: filled('Two'), week3: filled('Three'), week4: filled('Four') };
    await assertSucceeds(learner.doc('sessions/brew101-05/challenges/learner-uid').update({ weeks: allWeeksEdited, status: 'in_progress', updatedAt: serverTimestamp() }));
    const submittedOneAndEditedRest = { ...allWeeksEdited, week1: { ...allWeeksEdited.week1, status: 'submitted' }, week2: { ...allWeeksEdited.week2, focus: 'Two revised' }, week3: { ...allWeeksEdited.week3, focus: 'Three revised' }, week4: { ...allWeeksEdited.week4, focus: 'Four revised' } };
    await assertSucceeds(learner.doc('sessions/brew101-05/challenges/learner-uid').update({ weeks: submittedOneAndEditedRest, status: 'in_progress', updatedAt: serverTimestamp() }));
  });

  test('lets only confirmed enrolees and the teaching staff read a session guide, and nobody write it', async () => {
    const guide = { offeringId: 'cupping', version: 1, title: 'Test guide', intro: 'Placeholder text only.' };
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('access_grants/admin-uid').set({ personId: 'person-900', role: 'admin', status: 'active' });
      await db.doc('access_grants/suspended-uid').set({ personId: 'person-901', role: 'learner', status: 'suspended' });
      await db.doc('enrolments/brew101-01_suspended-uid').set({ sessionId: 'brew101-01', uid: 'suspended-uid', personId: 'person-901', status: 'confirmed' });
      for (const sessionId of ['brew101-01', 'brew101-pending', 'brew101-99']) {
        await db.doc(`sessions/${sessionId}/guide/main`).set(guide);
      }
      await db.doc('sessions/brew101-01/guide/other').set(guide);
    });
    const learner = testEnv.authenticatedContext('learner-uid').firestore();
    const instructor = testEnv.authenticatedContext('instructor-uid').firestore();
    const unassigned = testEnv.authenticatedContext('unassigned-instructor-uid').firestore();
    const admin = testEnv.authenticatedContext('admin-uid').firestore();
    const ungranted = testEnv.authenticatedContext('ungranted-uid').firestore();
    const suspended = testEnv.authenticatedContext('suspended-uid').firestore();
    const anonymous = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(learner.doc('sessions/brew101-01/guide/main').get());
    await assertSucceeds(instructor.doc('sessions/brew101-01/guide/main').get());
    await assertSucceeds(admin.doc('sessions/brew101-01/guide/main').get());

    await assertFails(learner.doc('sessions/brew101-pending/guide/main').get());
    await assertFails(learner.doc('sessions/brew101-99/guide/main').get());
    await assertFails(learner.doc('sessions/brew101-01/guide/other').get());
    await assertFails(unassigned.doc('sessions/brew101-01/guide/main').get());
    await assertFails(ungranted.doc('sessions/brew101-01/guide/main').get());
    await assertFails(suspended.doc('sessions/brew101-01/guide/main').get());
    await assertFails(anonymous.doc('sessions/brew101-01/guide/main').get());

    await assertFails(learner.collection('sessions/brew101-01/guide').get());
    await assertFails(admin.collection('sessions/brew101-01/guide').get());

    for (const [name, db] of [['learner', learner], ['instructor', instructor], ['admin', admin], ['anonymous', anonymous]]) {
      await assertFails(db.doc('sessions/brew101-01/guide/main').set({ ...guide, intro: `Written by ${name}` }));
      await assertFails(db.doc('sessions/brew101-01/guide/main').update({ intro: `Edited by ${name}` }));
      await assertFails(db.doc('sessions/brew101-01/guide/main').delete());
      await assertFails(db.doc('sessions/brew101-new/guide/main').set(guide));
    }
  });

  test('applies the same guide access to a Barista 101 session and denies every write', async () => {
    const guide = { offeringId: 'barista101', version: 1, title: 'Test guide', intro: 'Placeholder text only.' };
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('access_grants/admin-uid').set({ personId: 'person-900', role: 'admin', status: 'active' });
      await db.doc('sessions/barista101-01').set({ title: 'Espresso Foundations', offeringId: 'barista101' });
      await db.doc('sessions/barista101-02').set({ title: 'Espresso Foundations', offeringId: 'barista101' });
      await db.doc('enrolments/barista101-01_learner-uid').set({ sessionId: 'barista101-01', uid: 'learner-uid', personId: 'person-123', status: 'confirmed' });
      await db.doc('enrolments/barista101-pending_learner-uid').set({ sessionId: 'barista101-pending', uid: 'learner-uid', personId: 'person-123', status: 'pending' });
      await db.doc('teaching_assignments/barista101-01_instructor-uid').set({ sessionId: 'barista101-01', uid: 'instructor-uid', status: 'active' });
      for (const sessionId of ['barista101-01', 'barista101-02', 'barista101-pending']) {
        await db.doc(`sessions/${sessionId}/guide/main`).set(guide);
      }
    });
    const learner = testEnv.authenticatedContext('learner-uid').firestore();
    const instructor = testEnv.authenticatedContext('instructor-uid').firestore();
    const unassigned = testEnv.authenticatedContext('unassigned-instructor-uid').firestore();
    const admin = testEnv.authenticatedContext('admin-uid').firestore();
    const anonymous = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(learner.doc('sessions/barista101-01/guide/main').get());
    await assertSucceeds(instructor.doc('sessions/barista101-01/guide/main').get());
    await assertSucceeds(admin.doc('sessions/barista101-01/guide/main').get());

    await assertFails(learner.doc('sessions/barista101-02/guide/main').get());
    await assertFails(learner.doc('sessions/barista101-pending/guide/main').get());
    await assertFails(unassigned.doc('sessions/barista101-01/guide/main').get());
    await assertFails(anonymous.doc('sessions/barista101-01/guide/main').get());
    await assertFails(learner.collection('sessions/barista101-01/guide').get());

    for (const [name, db] of [['learner', learner], ['instructor', instructor], ['admin', admin], ['anonymous', anonymous]]) {
      await assertFails(db.doc('sessions/barista101-01/guide/main').set({ ...guide, intro: `Written by ${name}` }));
      await assertFails(db.doc('sessions/barista101-01/guide/main').update({ intro: `Edited by ${name}` }));
      await assertFails(db.doc('sessions/barista101-01/guide/main').delete());
    }
    // Barista 101 is not a Public Cupping session, so the night record stays closed to it.
    await assertFails(instructor.doc('sessions/barista101-01/night_record/main').set({ sessionId: 'barista101-01', hostUid: 'instructor-uid' }));
  });

  test('lets only the teaching staff keep a night record for a Public Cupping session', async () => {
    const emptySeats = () => Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`s${index + 1}`, { cup: null, buy: '', bought: '', words: '' }]));
    const night = (overrides = {}) => ({
      sessionId: 'cupping-01', hostUid: 'instructor-uid', status: 'draft', date: '2026-10-24', theme: 'Range Night', host: 'Host',
      guests: 12, redeemed: 0, flight: ['a', 'b', 'c', 'd'], seats: emptySeats(), tally: {}, words: [], notes: '',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...overrides,
    });
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('access_grants/admin-uid').set({ personId: 'person-900', role: 'admin', status: 'active' });
      await db.doc('sessions/cupping-01').set({ title: 'Range Night', offeringId: 'cupping' });
      await db.doc('sessions/cupping-02').set({ title: 'Origins Night', offeringId: 'cupping' });
      await db.doc('teaching_assignments/cupping-01_instructor-uid').set({ sessionId: 'cupping-01', uid: 'instructor-uid', status: 'active' });
      await db.doc('enrolments/cupping-01_learner-uid').set({ sessionId: 'cupping-01', uid: 'learner-uid', personId: 'person-123', status: 'confirmed' });
    });
    const instructor = testEnv.authenticatedContext('instructor-uid').firestore();
    const unassigned = testEnv.authenticatedContext('unassigned-instructor-uid').firestore();
    const learner = testEnv.authenticatedContext('learner-uid').firestore();
    const admin = testEnv.authenticatedContext('admin-uid').firestore();
    const anonymous = testEnv.unauthenticatedContext().firestore();
    const ref = (db, sessionId = 'cupping-01') => db.doc(`sessions/${sessionId}/night_record/main`);

    // A fully filled record (all 12 seats, longest text) stays inside the Rules expression limit.
    const fullSeats = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`s${index + 1}`, { cup: (index % 4) + 1, buy: 'yes', bought: 'no', words: 'x'.repeat(300) }]));
    await assertSucceeds(ref(instructor).set(night({ seats: fullSeats, tally: { r1c1: 3, r1c2: 4 }, words: ['one', 'two'], notes: 'n'.repeat(1000), status: 'draft' })));
    const stored = (await ref(instructor).get()).data();
    await assertSucceeds(ref(instructor).set(night({ status: 'final', createdAt: stored.createdAt, seats: fullSeats })));

    // Ownership and identity are immutable.
    await assertFails(ref(instructor).set(night({ hostUid: 'someone-else', createdAt: stored.createdAt })));
    await assertFails(ref(instructor).set(night({ sessionId: 'cupping-02', createdAt: stored.createdAt })));
    await assertFails(ref(instructor).set(night({ createdAt: new Date('2020-01-01T00:00:00Z') })));
    await assertFails(ref(instructor).set(night({ createdAt: stored.createdAt, updatedAt: new Date('2020-01-01T00:00:00Z') })));
    await assertFails(ref(instructor, 'cupping-02').set(night({ sessionId: 'cupping-02' })));

    // Reading and writing is staff-only, for Public Cupping sessions only.
    await assertSucceeds(ref(instructor).get());
    await assertFails(ref(unassigned).get());
    await assertFails(ref(learner).get());
    await assertFails(ref(anonymous).get());
    await assertFails(ref(unassigned).set(night({ hostUid: 'unassigned-instructor-uid' })));
    await assertFails(ref(learner).set(night({ hostUid: 'learner-uid' })));
    await assertFails(ref(anonymous).set(night()));
    await assertFails(ref(instructor, 'brew101-01').set(night({ sessionId: 'brew101-01' })));
    await assertSucceeds(ref(admin, 'cupping-02').set(night({ sessionId: 'cupping-02', hostUid: 'admin-uid' })));

    // No delete, no listing.
    await assertFails(ref(instructor).delete());
    await assertFails(instructor.collection('sessions/cupping-01/night_record').get());

    // Malformed shapes are refused.
    const bad = (overrides) => assertFails(ref(instructor).set(night({ createdAt: stored.createdAt, ...overrides })));
    await bad({ extra: 'field' });
    await bad({ status: 'published' });
    await bad({ guests: -1 });
    await bad({ guests: 41 });
    await bad({ redeemed: 'many' });
    await bad({ flight: ['a', 'b', 'c'] });
    await bad({ theme: 't'.repeat(81) });
    await bad({ notes: 'n'.repeat(1001) });
    await bad({ words: Array.from({ length: 41 }, () => 'w') });
    await bad({ tally: Object.fromEntries(Array.from({ length: 17 }, (_, index) => [`k${index}`, 1])) });
    await bad({ seats: { ...emptySeats(), s13: { cup: null, buy: '', bought: '', words: '' } } });
  });

  test('publishes the upcoming dates to everyone and lets only active staff change them', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.doc('access_grants/admin-uid').set({ personId: 'person-900', role: 'admin', status: 'active' });
      await db.doc('access_grants/suspended-instructor-uid').set({ personId: 'person-902', role: 'instructor', status: 'suspended' });
      await db.doc('public_schedule/current').set({ items: [], updatedAt: new Date('2026-10-01T00:00:00Z') });
      await db.doc('public_schedule/other').set({ items: [], updatedAt: new Date('2026-10-01T00:00:00Z') });
    });
    const anonymous = testEnv.unauthenticatedContext().firestore();
    const learner = testEnv.authenticatedContext('learner-uid').firestore();
    const ungranted = testEnv.authenticatedContext('ungranted-uid').firestore();
    const instructor = testEnv.authenticatedContext('instructor-uid').firestore();
    const unassignedInstructor = testEnv.authenticatedContext('unassigned-instructor-uid').firestore();
    const suspended = testEnv.authenticatedContext('suspended-instructor-uid').firestore();
    const admin = testEnv.authenticatedContext('admin-uid').firestore();
    const item = (n) => ({ id: `d${n}`, offeringId: 'cupping', title: 'Range Night', date: '2026-11-07', time: '8:00 pm', venue: 'Noice', status: 'open', note: '' });
    const schedule = (overrides = {}) => ({ items: [item(1)], updatedAt: serverTimestamp(), ...overrides });
    const ref = (db, id = 'current') => db.doc(`public_schedule/${id}`);

    // Anyone, signed in or not, can read the one published document and nothing else here.
    await assertSucceeds(ref(anonymous).get());
    await assertSucceeds(ref(learner).get());
    await assertFails(ref(anonymous, 'other').get());
    await assertFails(anonymous.collection('public_schedule').get());
    await assertFails(instructor.collection('public_schedule').get());

    // Any active instructor or admin may publish; nobody else may.
    await assertSucceeds(ref(instructor).set(schedule({ items: Array.from({ length: 12 }, (_, index) => item(index)) })));
    await assertSucceeds(ref(unassignedInstructor).set(schedule({ items: [] })));
    await assertSucceeds(ref(admin).set(schedule()));
    await assertFails(ref(anonymous).set(schedule()));
    await assertFails(ref(learner).set(schedule()));
    await assertFails(ref(ungranted).set(schedule()));
    await assertFails(ref(suspended).set(schedule()));

    // Shape, document id, timestamp, and deletion.
    await assertFails(ref(instructor, 'other').set(schedule()));
    await assertFails(ref(instructor, 'extra').set(schedule()));
    await assertFails(ref(instructor).set(schedule({ items: Array.from({ length: 13 }, (_, index) => item(index)) })));
    await assertFails(ref(instructor).set(schedule({ items: 'not a list' })));
    await assertFails(ref(instructor).set(schedule({ extra: 'field' })));
    await assertFails(ref(instructor).set({ items: [] }));
    await assertFails(ref(instructor).set(schedule({ updatedAt: new Date('2020-01-01T00:00:00Z') })));
    await assertFails(ref(instructor).delete());
    await assertFails(ref(admin).delete());
  });

  test('denies ungranted users, unauthenticated writes, and every Storage path', async () => {
    const ungranted = testEnv.authenticatedContext('ungranted-uid').firestore();
    const anonymous = testEnv.unauthenticatedContext();
    await assertFails(ungranted.doc('people/person-123').get());
    await assertFails(ungranted.doc('sessions/brew101-01').get());
    await assertFails(ungranted.doc('sessions/brew101-01/challenges/learner-uid').get());
    await assertFails(anonymous.firestore().doc('courses/brew101').get());
    await assertFails(anonymous.firestore().doc('sessions/brew101-01').get());
    await assertFails(anonymous.firestore().collection('sessions').get());
    await assertFails(anonymous.firestore().doc('sessions/brew101-01/challenges/learner-uid').get());
    await assertFails(anonymous.storage().ref('private/brew101-guide.pdf').getDownloadURL());
  });
});
