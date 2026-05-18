import { test as setup } from '@playwright/test';
import path from 'path';

/**
 * One-time login. Run headed: npm run test:e2e:auth
 *
 * When E2E_EMAIL and E2E_PASSWORD are provided, the setup logs in
 * automatically using the password form and saves the session for the
 * rest of the suite. Without those env vars it falls back to the manual
 * headed flow.
 */
const authFile = path.join(__dirname, '.auth/user.json');

async function waitForSessionDataCookie(page: Parameters<typeof setup>[1] extends never ? never : any) {
  await page.waitForFunction(async () => {
    const cookies = await window.document.cookie;
    return cookies.includes('session_data');
  }, undefined, { timeout: 30_000 }).catch(() => null);

  await page.waitForFunction(async () => {
    return document.cookie.includes('session_data');
  }, undefined, { timeout: 5_000 }).catch(() => null);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const cookies = await page.context().cookies();
    if (cookies.some((cookie) => cookie.name.includes('session_data'))) return;

    await page.request.get('/api/auth/get-session').catch(() => null);
    await page.waitForTimeout(1_000);
  }

  throw new Error('session_data cookie was not minted before saving Playwright storage state');
}

setup('capture authenticated session', async ({ page }) => {
  setup.setTimeout(200_000);
  await page.goto('/login');

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (email && password) {
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
  } else {
    console.log('\n👉  Complete the sign-in in the browser window…');
    console.log('    The test continues automatically once you reach the app.\n');
  }

  // Login lands the user back on an in-app route (not /login or /auth).
  await page.waitForURL(
    (url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth'),
    { timeout: 180_000 },
  );

  await waitForSessionDataCookie(page);

  await page.context().storageState({ path: authFile });
  console.log(`✅  Session saved → ${authFile}`);
});
