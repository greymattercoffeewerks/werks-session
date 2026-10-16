const { readFileSync } = require('node:fs');
const { after, before, describe, test } = require('node:test');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');

let testEnv;

const challenge = (overrides = {}) => ({
  sessionId: 'brew101-01',
  ownerUid: 'learner-uid',
  personId: 'person-123',
  status: 'in_progress',
  weeks: { week1: { focus: 'Ratio', note: 'Sweeter at 1:16.' } },
  createdAt: '2026-10-16T00:00:00.000Z',
  updatedAt: '2026-10-16T00:00:00.000Z',
  ...overrides,
});

const completedWeeks = {
  week1: { focus: 'Ratio', coffee: 'ttku', recipe: '15g : 250g', tastingNote: 'Sweeter at 1:16.', changeMade: 'Held grind steady.', complete: true },
  week2: { focus: 'Grind', coffee: 'ttku', recipe: '15g : 250g', tastingNote: 'Cleaner finish.', changeMade: 'Moved one notch finer.', complete: true },
  week3: { focus: 'Beans', coffee: 'ttku', recipe: '15g : 250g', tastingNote: 'More floral.', changeMade: 'Changed coffee.', complete: true },
  week4: { focus: 'Technique', coffee: 'ttku', recipe: '15g : 250g', tastingNote: 'Even extraction.', changeMade: 'Poured more slowly.', complete: true },
};

const blankCompletedWeeks = {
  week1: { focus: ' ', coffee: ' ', recipe: ' ', tastingNote: ' ', changeMade: ' ', complete: true },
  week2: { focus: ' ', coffee: ' ', recipe: ' ', tastingNote: ' ', changeMade: ' ', complete: true },
  week3: { focus: ' ', coffee: ' ', recipe: ' ', tastingNote: ' ', changeMade: ' ', complete: true },
  week4: { focus: ' ', coffee: ' ', recipe: ' ', tastingNote: ' ', changeMade: ' ', complete: true },
};

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
    await assertFails(db.doc('access_grants/instructor-uid').get());
    await assertFails(db.doc('people/person-456').get());
  });

  test('allows a confirmed learner to create and submit only their own challenge', async () => {
    const db = testEnv.authenticatedContext('learner-uid').firestore();
    const draft = challenge({ sessionId: 'brew101-02', status: 'in_progress' });
    await assertSucceeds(db.doc('sessions/brew101-02/challenges/learner-uid').set(draft));
    await assertFails(db.doc('sessions/brew101-01/challenges/learner-uid').update({ status: 'submitted', submittedAt: '2026-10-16T00:30:00.000Z' }));
    await assertFails(db.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: blankCompletedWeeks, status: 'submitted', submittedAt: '2026-10-16T00:30:00.000Z' }));
    await assertSucceeds(db.doc('sessions/brew101-01/challenges/learner-uid').update({ weeks: completedWeeks, status: 'submitted', submittedAt: '2026-10-16T00:30:00.000Z' }));
    await assertFails(db.doc('sessions/brew101-01/challenges/learner-uid').update({ reviewerNote: 'Self-approved' }));
    await assertFails(db.doc('access_grants/learner-uid').set({ personId: 'person-123', role: 'admin', status: 'active' }));
  });

  test('allows only the assigned instructor to review a submitted challenge', async () => {
    const instructor = testEnv.authenticatedContext('instructor-uid').firestore();
    const unassigned = testEnv.authenticatedContext('unassigned-instructor-uid').firestore();
    await assertSucceeds(instructor.doc('sessions/brew101-01/challenges/learner-uid').get());
    await assertSucceeds(instructor.doc('sessions/brew101-01/challenges/learner-uid').update({ status: 'approved', reviewerNote: 'Clear observation and a useful next change.', reviewedAt: '2026-10-16T01:00:00.000Z' }));
    await assertFails(instructor.doc('teaching_assignments/brew101-01_instructor-uid').set({ status: 'active' }));
    await assertFails(unassigned.doc('sessions/brew101-01/challenges/learner-uid').get());
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
