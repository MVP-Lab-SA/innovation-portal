import { test, expect } from '@playwright/test';

/**
 * Admin section pages + the operational/help pages. Each must load for
 * the authenticated (admin) user without bouncing to /login.
 */

const PAGES: Array<{ name: string; path: string }> = [
  { name: 'admin — data', path: '/admin/data' },
  { name: 'admin — users', path: '/admin/users' },
  { name: 'admin — lookups', path: '/admin/lookups' },
  { name: 'admin — audit log', path: '/admin/audit-log' },
  { name: 'help', path: '/help' },
];

for (const p of PAGES) {
  test(`${p.name} page loads`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('h1').first()).toBeVisible();
  });
}

test('the admin data page lets you switch entities', async ({ page }) => {
  await page.goto('/admin/data?entity=experts');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
  await page.goto('/admin/data?entity=expert-opinions');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByText(/غير معرّف|غير معروف/)).toHaveCount(0);
});

test('the audit log shows change history or an empty state', async ({ page }) => {
  await page.goto('/admin/audit-log');
  await expect(page).not.toHaveURL(/\/login/);
  const table = page.locator('table').first();
  const empty = page.getByText(/لا توجد|لا يوجد/).first();
  await expect(table.or(empty)).toBeVisible({ timeout: 20_000 });
});

test('an unknown route shows the not-found page', async ({ page }) => {
  const res = await page.goto('/this-route-does-not-exist');
  // Next renders the 404 page (status 404) — not a redirect to login.
  expect(res?.status()).toBe(404);
});
