import { expect, test } from '@playwright/test';
import { createTestEnvironment, currentUid, signInWithGoogle } from './support/app';

test.describe('sign-in', () => {
  test('signs in with Google through the Auth emulator and shows the pending state', async ({ page }) => {
    const environment = await createTestEnvironment();
    await environment.clearFirestore();

    await page.goto('/');
    await signInWithGoogle(page, 'pending@werks.test');

    await expect(page.getByRole('heading', { name: 'Access is being arranged.' })).toBeVisible();
    await expect(page.getByText('Signing in does not create learner access.')).toBeVisible();

    const uid = await currentUid(page);
    expect(uid).toMatch(/^[A-Za-z0-9]{10,}$/);

    await environment.cleanup();
  });
});
