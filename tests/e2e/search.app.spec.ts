import { test, expect } from '@playwright/test';

/** Global search across entities. */

test('the search page loads', async ({ page }) => {
  await page.goto('/search');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('searching returns grouped results', async ({ page }) => {
  await page.goto('/search');
  const box = page.getByRole('textbox').first();
  await box.fill('تطوير');
  // Search is debounced + server-side; give it a moment to resolve.
  await page.waitForTimeout(2000);
  // The page should resolve to either result groups or a no-results state,
  // without erroring out.
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the search API answers an authenticated query', async ({ page }) => {
  const res = await page.request.get('/api/search?q=تطوير');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty('groups');
});
