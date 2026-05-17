import { test, expect } from '@playwright/test';

/**
 * Admin data surface. Read-only — opens the generic CRUD table and the
 * create form to confirm they render, but never persists a record.
 */

test('the admin data page opens an entity table', async ({ page }) => {
  await page.goto('/admin/data?entity=campaigns');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
  // Either the data table or an empty-state is shown.
  const table = page.locator('table').first();
  const emptyState = page.getByText('لا توجد').first();
  await expect(table.or(emptyState)).toBeVisible();
});

test('the business-challenges entity is manageable in admin', async ({ page }) => {
  await page.goto('/admin/data?entity=business-challenges');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the new campaign-business-challenges junction entity is registered', async ({ page }) => {
  await page.goto('/admin/data?entity=campaign-business-challenges');
  await expect(page).not.toHaveURL(/\/login/);
  // A known/registered entity renders its UI; an unknown one shows an error.
  await expect(page.getByText(/غير معرّف|غير معروف/)).toHaveCount(0);
});
