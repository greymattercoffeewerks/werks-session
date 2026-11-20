import { expect, type Page } from '@playwright/test';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, type Firestore } from 'firebase/firestore';

/**
 * Shared helpers for the browser suite. The app is started with
 * VITE_FIREBASE_EMULATORS=true, so its Firestore and Auth clients talk to the local
 * emulators; data is seeded with the rules-bypassing test context, exactly as staff
 * would seed it by hand.
 */
export const projectId = 'demo-werks-sessions';

export async function createTestEnvironment(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080 },
  });
}

export async function seed(
  environment: RulesTestEnvironment,
  write: (database: Firestore) => Promise<void>,
): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    // The test environment hands back the compat-typed instance; it is the same client
    // the modular helpers below expect at runtime.
    await write(context.firestore() as unknown as Firestore);
  });
}

/**
 * Signs in through the app's real "Continue with Google" button. With the Auth emulator
 * connected, that opens the emulator's identity-provider widget, which is driven here the
 * way a person would: add an account (or pick an existing one) and submit.
 */
export async function signInWithGoogle(page: Page, email: string): Promise<void> {
  await page.getByRole('link', { name: 'Learner access' }).click();
  const signInButton = page.getByRole('button', { name: 'Continue with Google' });
  await expect(signInButton).toBeVisible();

  const popupPromise = page.waitForEvent('popup');
  await signInButton.click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');

  // The emulator renders an existing account as `.js-reuse-account`, which is the
  // element that carries the click handler; clicking a wrapping list item can miss it.
  const existingAccount = popup.locator('.js-reuse-account', { hasText: email });
  const closed = popup.waitForEvent('close');

  if ((await existingAccount.count()) > 0) {
    await existingAccount.first().click();
  } else {
    await popup.locator('#add-account-button').click();
    await popup.locator('#email-input').fill(email);
    const displayName = popup.locator('#display-name-input');
    if ((await displayName.count()) > 0) {
      await displayName.fill(email.split('@')[0]);
    }
    await popup.locator('#sign-in').click();
  }

  await closed;
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}

/**
 * Remounts the signed-in experience so it re-reads Firestore. Navigation is component
 * state, not a URL, so a browser reload would land back on the public home page.
 */
export async function reopenAccess(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Sessions', exact: true }).click();
  await page.getByRole('link', { name: 'Learner access' }).click();
}

/** Reads the signed-in uid from Firebase Auth's IndexedDB persistence. */ export async function currentUid(
  page: Page,
): Promise<string> {
  const uid = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('firebaseLocalStorageDb');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const store = database.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage');
    const entries = await new Promise<unknown[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const user = entries
      .map((entry) =>
        entry && typeof entry === 'object' && 'value' in entry ? (entry as { value: unknown }).value : null,
      )
      .find(
        (value): value is { uid: string } =>
          Boolean(value) && typeof value === 'object' && typeof (value as { uid?: unknown }).uid === 'string',
      );
    return user?.uid ?? '';
  });

  expect(uid, 'the signed-in uid should be readable from IndexedDB').not.toBe('');
  return uid;
}

type SeedOptions = {
  uid: string;
  sessionId: string;
  title?: string;
  offeringId?: 'cupping' | 'brew101' | 'barista101';
};

/** Staff-created grant, confirmed enrolment, and session document for a learner. */
export async function seedLearner(database: Firestore, options: SeedOptions): Promise<void> {
  const personId = `person-${options.uid}`;
  await setDoc(doc(database, 'access_grants', options.uid), { status: 'active', personId, role: 'learner' });
  // Rules resolve the enrolment by the exact `{sessionId}_{uid}` document id.
  await setDoc(doc(database, 'enrolments', `${options.sessionId}_${options.uid}`), {
    uid: options.uid,
    personId,
    sessionId: options.sessionId,
    status: 'confirmed',
  });
  await setDoc(doc(database, 'sessions', options.sessionId), {
    title: options.title ?? 'Brew 101',
    offeringId: options.offeringId ?? 'brew101',
  });
}

/** Staff-created instructor grant and teaching assignment for a session. */
export async function seedInstructor(database: Firestore, options: SeedOptions): Promise<void> {
  const personId = `person-${options.uid}`;
  await setDoc(doc(database, 'access_grants', options.uid), { status: 'active', personId, role: 'instructor' });
  await setDoc(doc(database, 'teaching_assignments', `${options.sessionId}_${options.uid}`), {
    uid: options.uid,
    sessionId: options.sessionId,
    status: 'active',
  });
  await setDoc(
    doc(database, 'sessions', options.sessionId),
    {
      title: options.title ?? 'Brew 101',
      offeringId: options.offeringId ?? 'brew101',
    },
    { merge: true },
  );
}
