import { expect, test } from '@playwright/test';
import { doc, setDoc } from 'firebase/firestore';
import { createTestEnvironment, currentUid, reopenAccess, seed, seedInstructor, seedLearner, signInWithGoogle } from './support/app';

/**
 * The pilot's critical path, in a real browser against the emulators:
 * sign in -> staff grant -> guide -> practice save and submit -> instructor review.
 */
test('learner completes a practice week and the instructor approves it', async ({ page }) => {
  const environment = await createTestEnvironment();
  await environment.clearFirestore();
  const sessionId = 'brew101-e2e';

  await page.goto('/');
  await signInWithGoogle(page, 'learner@werks.test');
  const learnerUid = await currentUid(page);

  await seed(environment, async (database) => {
    await seedLearner(database, { uid: learnerUid, sessionId, title: 'Brew 101', offeringId: 'brew101' });
    await setDoc(doc(database, 'sessions', sessionId, 'guide', 'main'), {
      title: 'Your table guide',
      intro: 'Bring a notebook and one coffee you already like.',
    });
  });

  await reopenAccess(page);
  await expect(page.getByRole('heading', { name: 'Your Brew 101 table.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your table guide' })).toBeVisible();

  await page.getByRole('button', { name: 'Start my practice' }).click();
  const weekOne = page.getByRole('group', { name: /Week 1/ });
  await weekOne.getByLabel('Focus').fill('Sweetness in the finish');
  await weekOne.getByLabel('Coffee').fill('Ethiopia, washed');
  await weekOne.getByLabel('Recipe').fill('15 g : 250 g');
  await weekOne.getByLabel('What you tasted').fill('Stone fruit and a long finish.');
  await weekOne.getByLabel('One change').fill('Grind one step finer next time.');
  await weekOne.getByLabel('This week is complete').check();
  await page.getByRole('button', { name: 'Save week' }).first().click();
  await expect(page.getByText('Week 1 draft saved.')).toBeVisible();

  await page.getByRole('button', { name: 'Submit week 1' }).click();
  await expect(page.getByText('Week 1 submitted. It is now locked while your instructor responds.')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await signInWithGoogle(page, 'instructor@werks.test');
  const instructorUid = await currentUid(page);

  await seed(environment, async (database) => {
    await seedInstructor(database, { uid: instructorUid, sessionId, title: 'Brew 101', offeringId: 'brew101' });
  });

  await reopenAccess(page);
  await expect(page.getByRole('heading', { name: 'Instructor review.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submitted practice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Week 1: Notice the cup' })).toBeVisible();

  await page.getByLabel('Feedback for the learner').fill('Clear observation. Keep the grind change and taste it twice.');
  await page.getByRole('button', { name: 'Approve week 1' }).click();
  await expect(page.getByRole('heading', { name: 'No submitted weeks are waiting.' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await signInWithGoogle(page, 'learner@werks.test');
  await expect(page.getByText('Reviewed and approved. This week is locked.')).toBeVisible();
  await expect(page.getByText('Keep the grind change and taste it twice.')).toBeVisible();

  await environment.cleanup();
});
