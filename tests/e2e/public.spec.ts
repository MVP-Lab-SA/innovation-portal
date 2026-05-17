import { test, expect } from '@playwright/test';

/**
 * Logged-out surface — runs in a fresh context with no saved session.
 * Verifies the auth wall: every protected route bounces to /login.
 */

test('the home page redirects to /login when signed out', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('the login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('body')).toBeVisible();
});

test('a dashboard route is gated behind auth', async ({ page }) => {
  await page.goto('/dashboards/executive');
  await expect(page).toHaveURL(/\/login/);
});

test('a record route is gated behind auth', async ({ page }) => {
  await page.goto('/records/business-challenges/anything');
  await expect(page).toHaveURL(/\/login/);
});

test('the admin area is gated behind auth', async ({ page }) => {
  await page.goto('/admin/data');
  await expect(page).toHaveURL(/\/login/);
});

test('the entities API rejects an unauthenticated request', async ({ request }) => {
  const res = await request.get('/api/entities/business-challenges', { maxRedirects: 0 });
  expect([302, 307, 308]).toContain(res.status());
  expect(res.headers()['location']).toContain('/login');
});
