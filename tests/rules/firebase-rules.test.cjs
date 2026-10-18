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
