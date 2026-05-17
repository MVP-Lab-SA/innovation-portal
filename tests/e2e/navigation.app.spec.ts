import { test, expect } from '@playwright/test';

/** Sidebar navigation between the main app sections. */

test('the home page renders for an authenticated user', async ({ page }) => {
  await page.goto('/');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the sidebar navigates to global search', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'البحث الشامل' }).click();
  await expect(page).toHaveURL(/\/search/);
});

test('the sidebar navigates to notifications', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'الإشعارات' }).click();
  await expect(page).toHaveURL(/\/notifications/);
});

test('the sidebar navigates to the tasks board', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'لوحة المهام' }).click();
  await expect(page).toHaveURL(/\/tasks/);
});

test('a dashboard is reachable from the home grid', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /الحملات/ }).first().click();
  await expect(page).toHaveURL(/\/dashboards\//);
  await expect(page.locator('h1').first()).toBeVisible();
});
