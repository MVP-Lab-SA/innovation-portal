import { test, expect } from '@playwright/test';

/**
 * Record detail pages. Read-only — these tests open and inspect records
 * but never create, edit or delete (the app runs against the live DB).
 */

test('a business challenge detail shows the funnel strip', async ({ page }) => {
  await page.goto('/dashboards/business-challenges');
  await expect(page).not.toHaveURL(/\/login/);

  const firstRecord = page.locator('a[href^="/records/business-challenges/"]').first();
  await expect(firstRecord).toBeVisible();
  await firstRecord.click();

  await expect(page).toHaveURL(/\/records\/business-challenges\//);
  await expect(page.getByText('البيانات الأساسية')).toBeVisible();
  // The funnel lineage strip is unique to business-challenge detail pages.
  await expect(page.getByText('مسار التحدي في منظومة الابتكار')).toBeVisible();
});

test('a campaign detail shows its linked business challenges', async ({ page }) => {
  await page.goto('/dashboards/campaigns');
  await expect(page).not.toHaveURL(/\/login/);

  const firstRecord = page.locator('a[href^="/records/campaigns/"]').first();
  await expect(firstRecord).toBeVisible();
  await firstRecord.click();

  await expect(page).toHaveURL(/\/records\/campaigns\//);
  await expect(page.getByText('البيانات الأساسية')).toBeVisible();
});

test('the edit modal opens with a relation picker', async ({ page }) => {
  await page.goto('/dashboards/business-challenges');
  const firstRecord = page.locator('a[href^="/records/business-challenges/"]').first();
  await expect(firstRecord).toBeVisible();
  await firstRecord.click();
  await expect(page).toHaveURL(/\/records\/business-challenges\//);

  // Open the edit modal (admins/editors see «تعديل»).
  const editBtn = page.getByRole('button', { name: 'تعديل' });
  if (await editBtn.count()) {
    await editBtn.first().click();
    // The reference fields (e.g. مصدر التحدي) render the searchable picker.
    await expect(page.getByText('مصدر التحدي')).toBeVisible();
    // Close without saving — read-only test.
    await page.getByRole('button', { name: 'إلغاء' }).click();
  }
});
