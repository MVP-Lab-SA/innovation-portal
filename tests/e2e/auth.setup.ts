import { test as setup } from '@playwright/test';
import path from 'path';

/**
 * One-time interactive login. Run headed:  npm run test:e2e:auth
 *
 * The app uses email-OTP, which can't be automated — so this opens a
 * real browser, waits (up to 3 minutes) for you to complete the sign-in
 * by hand, then saves the session for every other test to reuse.
 *
 * Sign in as an ADMIN account so the admin specs can run.
 */
const authFile = path.join(__dirname, '.auth/user.json');

setup('capture authenticated session', async ({ page }) => {
  setup.setTimeout(200_000);
  await page.goto('/');

  console.log('\n👉  Complete the OTP sign-in in the browser window…');
  console.log('    The test continues automatically once you reach the app.\n');

  // Login lands the user back on an in-app route (not /login or /auth).
  await page.waitForURL(
    (url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth'),
    { timeout: 180_000 },
  );

  await page.context().storageState({ path: authFile });
  console.log(`✅  Session saved → ${authFile}`);
});
