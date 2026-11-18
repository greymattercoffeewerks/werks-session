import { expect, test } from '@playwright/test';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { createTestEnvironment, currentUid, reopenAccess, seed, seedInstructor, signInWithGoogle } from './support/app';

/** A date far enough ahead that the "upcoming" filter cannot hide it as the calendar moves. */
const futureDate = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
})();

test('the host records a Public Cupping night and it survives a reload', async ({ page }) => {
  const environment = await createTestEnvironment();
  await environment.clearFirestore();
  const sessionId = 'cupping-e2e';

  await page.goto('/');
  await signInWithGoogle(page, 'host@werks.test');
  const hostUid = await currentUid(page);

  await seed(environment, async (database) => {
    await seedInstructor(database, { uid: hostUid, sessionId, title: 'Public Cupping', offeringId: 'cupping' });
  });

  await reopenAccess(page);
  const nightRecord = page.getByRole('region', { name: 'Record a night' });
  await expect(nightRecord).toBeVisible();

  await nightRecord.getByLabel('Date', { exact: true }).fill(futureDate);
  await nightRecord.getByLabel('Theme', { exact: true }).fill('Range Night');
  await nightRecord.getByLabel('Guests', { exact: true }).fill('6');
  await nightRecord.getByLabel('Seat 1: #1 cup').selectOption('2');
  await nightRecord.getByLabel('Seat 1: would buy').selectOption('yes');
  await nightRecord.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('Night record saved as a draft.')).toBeVisible();

  await reopenAccess(page);
  await expect(nightRecord.getByLabel('Date', { exact: true })).toHaveValue(futureDate);
  await expect(nightRecord.getByLabel('Theme', { exact: true })).toHaveValue('Range Night');
  await expect(nightRecord.getByRole('button', { name: 'Download CSV' })).toBeVisible();

  await environment.cleanup();
});

test('an instructor publishes a date and it appears on the public page', async ({ page }) => {
  const environment = await createTestEnvironment();
  await environment.clearFirestore();
  const sessionId = 'schedule-e2e';

  await page.goto('/');
  await signInWithGoogle(page, 'publisher@werks.test');
  const publisherUid = await currentUid(page);

  await seed(environment, async (database) => {
    await seedInstructor(database, { uid: publisherUid, sessionId, title: 'Public Cupping', offeringId: 'cupping' });
  });

  await reopenAccess(page);
  const editor = page.getByRole('region', { name: 'Upcoming dates' });
  await expect(editor).toBeVisible();

  await editor.getByRole('button', { name: 'Add a date' }).click();
  await editor.getByLabel('Title', { exact: true }).fill('E2E Range Night');
  await editor.getByLabel('Date', { exact: true }).fill(futureDate);
  await editor.getByLabel('Time', { exact: true }).fill('8:00 pm');
  await editor.getByLabel('Venue', { exact: true }).fill('Noice, after hours');
  await editor.getByRole('button', { name: 'Publish dates' }).click();
  await expect(page.getByText('Published. The front page shows these dates now, and past dates hide on their own.')).toBeVisible();

  await page.getByRole('button', { name: 'Sessions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Next tables.' })).toBeVisible();
  await expect(page.getByText('E2E Range Night')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ask about this date →' })).toBeVisible();

  await environment.cleanup();
});

test('an instructor who did not host a night sees that record read-only', async ({ page }) => {
  const environment = await createTestEnvironment();
  await environment.clearFirestore();
  const sessionId = 'cupping-readonly';

  await page.goto('/');
  await signInWithGoogle(page, 'second-host@werks.test');
  const uid = await currentUid(page);

  await seed(environment, async (database) => {
    await seedInstructor(database, { uid, sessionId, title: 'Public Cupping', offeringId: 'cupping' });
    await setDoc(doc(database, 'sessions', sessionId, 'night_record', 'main'), {
      sessionId,
      hostUid: 'original-host-uid',
      status: 'final',
      date: '2026-11-01',
      theme: 'Range Night',
      host: 'Firdaus',
      guests: 1,
      redeemed: 0,
      flight: ['a', 'b', 'c', 'd'],
      seats: {},
      tally: {},
      words: [],
      notes: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  await reopenAccess(page);
  const nightRecord = page.getByRole('region', { name: 'Record a night' });
  await expect(nightRecord).toBeVisible();
  await expect(nightRecord.getByText('Only the host who created this record can edit it.')).toBeVisible();
  await expect(nightRecord.getByRole('button', { name: 'Save draft' })).toHaveCount(0);
  await expect(nightRecord.getByRole('button', { name: 'Save as final' })).toHaveCount(0);
  await expect(nightRecord.getByLabel('Theme', { exact: true })).toBeDisabled();
  await expect(nightRecord.getByLabel('Theme', { exact: true })).toHaveValue('Range Night');
});
