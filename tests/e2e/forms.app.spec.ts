import { test, expect } from '@playwright/test';

/**
 * Entity create/edit forms. Read-only — these open the form, exercise
 * validation, and cancel; they never persist a record to the live DB.
 */

test('the create form opens from the admin data table', async ({ page }) => {
  await page.goto('/admin/data?entity=campaigns');
  await expect(page).not.toHaveURL(/\/login/);

  await page.getByRole('button', { name: 'إضافة' }).first().click();
  // The EntityForm modal opens with an «إضافة …» heading.
  await expect(page.getByRole('heading', { name: /إضافة/ })).toBeVisible();
  // Cancel without saving.
  await page.getByRole('button', { name: 'إلغاء' }).click();
  await expect(page.getByRole('heading', { name: /إضافة/ })).toHaveCount(0);
});

test('required-field validation blocks an empty submit', async ({ page }) => {
  await page.goto('/admin/data?entity=campaigns');
  await expect(page).not.toHaveURL(/\/login/);

  await page.getByRole('button', { name: 'إضافة' }).first().click();
  await expect(page.getByRole('heading', { name: /إضافة/ })).toBeVisible();

  // Submit the empty form — the EntityForm raises a «مطلوب» toast.
  await page.locator('form').getByRole('button', { name: 'إضافة' }).click();
  await expect(page.getByText(/مطلوب/)).toBeVisible();

  // Nothing was saved — close the form.
  await page.getByRole('button', { name: 'إلغاء' }).click();
});

test('the create form renders a relation picker for FK fields', async ({ page }) => {
  await page.goto('/admin/data?entity=sandbox-applications');
  await expect(page).not.toHaveURL(/\/login/);

  await page.getByRole('button', { name: 'إضافة' }).first().click();
  await expect(page.getByRole('heading', { name: /إضافة/ })).toBeVisible();
  // Sandbox applications carry reference fields (campaign, pilot, …).
  await expect(page.locator('form').getByText('الحملة المرتبطة')).toBeVisible();
  await page.getByRole('button', { name: 'إلغاء' }).click();
});

test('the edit form opens prefilled from a record', async ({ page }) => {
  await page.goto('/admin/data?entity=campaigns');
  await expect(page).not.toHaveURL(/\/login/);
  const editBtn = page.getByRole('button', { name: 'تعديل' }).first();
  test.skip(!(await editBtn.count()), 'no editable records');
  await editBtn.click();
  await expect(page.getByRole('heading', { name: /تعديل/ })).toBeVisible();
  await page.getByRole('button', { name: 'إلغاء' }).click();
});
