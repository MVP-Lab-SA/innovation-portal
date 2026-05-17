import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Auth is via a saved session (storageState): run the
 * `setup` project once (`npm run test:e2e:auth`) to complete the OTP
 * login in a headed browser — it captures the session to
 * tests/e2e/.auth/user.json, which the `app` project then reuses.
 *
 * Target a different host with E2E_BASE_URL (e.g. the Vercel URL);
 * otherwise it runs against a local dev server on port 3002.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3002';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    locale: 'ar-SA',
  },
  projects: [
    // One-time interactive login — run via `npm run test:e2e:auth`.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // Logged-out surface — fresh context, no saved session.
    { name: 'public', testMatch: /public\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    // Authenticated app — reuses the saved session.
    {
      name: 'app',
      testMatch: /.*\.app\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/user.json' },
    },
  ],
  // When testing locally, auto-start the dev server (reused if already up).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
