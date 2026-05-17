import { test, expect } from '@playwright/test';

/** Notifications inbox + the supporting operational pages. */

test('the notifications page loads', async ({ page }) => {
  await page.goto('/notifications');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the notifications API answers an authenticated request', async ({ page }) => {
  const res = await page.request.get('/api/notifications');
  expect(res.ok()).toBeTruthy();
});

test('the approvals queue loads', async ({ page }) => {
  await page.goto('/approvals');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the my-work page loads', async ({ page }) => {
  await page.goto('/my-work');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the profile page loads', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});
