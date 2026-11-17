import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against the local Firebase emulators and the Vite dev server.
 * The emulators are started by `npm run test:e2e` (firebase emulators:exec), which
 * wraps this config; the dev server is started here.
 */
const port = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // The emulator is shared state, so the suite runs serially.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Bind IPv4 explicitly: Vite's default localhost binding is IPv6-only on some hosts.
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
    // The app must use the demo project id the emulators are started with, or its
    // Firestore client and the seeded data live in different emulator namespaces.
    env: { VITE_FIREBASE_EMULATORS: 'true', VITE_FIREBASE_PROJECT_ID: 'demo-werks-sessions' },
  },
});
