const { readFileSync } = require('node:fs');
const { after, before, describe, test } = require('node:test');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-werks-sessions',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.doc('people/person-123').set({ personId: 'person-123', email: 'maya@example.com' });
    await db.doc('learning_records/record-123').set({ personId: 'person-123' });
  });
});

after(async () => testEnv.cleanup());

describe('Firebase access controls', () => {
  test('allows a learner to read only their own profile and record', async () => {
    const context = testEnv.authenticatedContext('firebase-subject', { person_id: 'person-123', role: 'learner' });
    const db = context.firestore();
    await assertSucceeds(db.doc('people/person-123').get());
    await assertSucceeds(db.doc('learning_records/record-123').get());
    await assertFails(db.doc('people/another-person').get());
  });

  test('denies unauthenticated documents and every Storage path', async () => {
    const context = testEnv.unauthenticatedContext();
    await assertFails(context.firestore().doc('people/person-123').get());
    await assertFails(context.storage().ref('private/brew101-guide.pdf').getDownloadURL());
  });

  test('allows staff to read learner records but not write them', async () => {
    const context = testEnv.authenticatedContext('staff-subject', { person_id: 'staff-123', role: 'instructor' });
    const db = context.firestore();
    await assertSucceeds(db.doc('learning_records/record-123').get());
    await assertFails(db.doc('learning_records/record-123').set({ personId: 'person-123' }));
  });
});
