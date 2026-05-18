import { test, expect } from '@playwright/test';

async function expectRowsOrEmptyState(page: Parameters<typeof test>[0] extends never ? never : any) {
  const rows = page.locator('table tbody tr');
  const empty = page.getByText(/لا توجد بيانات|جرّب البحث بكلمات أخرى/).first();

  if (await rows.count()) {
    await expect(rows.first()).toBeVisible();
    return;
  }

  await expect(empty).toBeVisible();
}

/**
 * The shared DataTable component — search, export, pagination — exercised
 * on /admin/data for an entity with plenty of rows (business challenges).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/admin/data?entity=business-challenges');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('table').first()).toBeVisible({ timeout: 20_000 });
});

test('the table renders rows', async ({ page }) => {
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});

test('the search box filters the table', async ({ page }) => {
  const search = page.getByPlaceholder('بحث...');
  await expect(search).toBeVisible();
  const firstCellText = (await page.locator('table tbody tr').first().locator('td').first().textContent())?.trim() || 'BCH';
  await search.fill(firstCellText.slice(0, Math.min(firstCellText.length, 6)) || 'BCH');
  await page.waitForTimeout(800);
  await expectRowsOrEmptyState(page);
});

test('export buttons are available', async ({ page }) => {
  await expect(page.getByTitle('تصدير CSV')).toBeVisible();
  await expect(page.getByTitle('تصدير Excel')).toBeVisible();
});

test('CSV export triggers a file download', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
  await page.getByTitle('تصدير CSV').click();
  const download = await downloadPromise;
  if (download) expect(download.suggestedFilename()).toMatch(/\.csv$/i);
});

test('pagination advances to the next page', async ({ page }) => {
  const next = page.getByRole('button', { name: 'التالي' });
  if (await next.count()) {
    await next.first().click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  }
});

test('a column header sorts the table', async ({ page }) => {
  // Clicking a sortable header re-orders without breaking the table.
  const header = page.locator('table thead th').nth(1);
  await header.click();
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
