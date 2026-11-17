import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createTestEnvironment } from './support/app';

test('the public page carries no signed-in experience and loads it on demand', async ({ page }) => {
  const environment = await createTestEnvironment();
  await environment.clearFirestore();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Make room for the cup.' })).toBeVisible();
  await expect(page.getByText('No dates announced yet.')).toBeVisible();

  // The signed-in module must not be fetched by an anonymous visitor. The dev server
  // serves the module path, so this checks the module itself rather than a built chunk name.
  expect(requests.some((url) => url.includes('/LearnerAccess'))).toBe(false);
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Learner access' }).click();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  expect(requests.some((url) => url.includes('/LearnerAccess'))).toBe(true);

  await environment.cleanup();
});

test('the public page and the sign-in page have no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Make room for the cup.' })).toBeVisible();
  const home = await new AxeBuilder({ page }).analyze();
  expect(home.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);

  await page.getByRole('button', { name: 'Learner access' }).click();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  const access = await new AxeBuilder({ page }).analyze();
  expect(access.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
});
