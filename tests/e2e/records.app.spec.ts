import { test, expect } from '@playwright/test';

/**
 * Record detail pages. Read-only — these tests open and inspect records
 * but never create, edit or delete (the app runs against the live DB).
 */

async function openFirstRecord(page: Parameters<typeof test>[1] extends never ? never : any, dashboardPath: string, recordHrefPrefix: string) {
  await page.goto(dashboardPath);
  await expect(page).not.toHaveURL(/\/login/);

  const firstRecord = page.locator(`a[href^="${recordHrefPrefix}"]`).first();
  const emptyState = page.getByText('لا توجد بيانات').first();
  await expect(firstRecord.or(emptyState)).toBeVisible({ timeout: 20_000 });
  if (await emptyState.isVisible().catch(() => false)) {
    return false;
  }
  await firstRecord.click();
  return true;
}

async function expectRecordContentOrLoadError(page: Parameters<typeof test>[1] extends never ? never : any, urlPattern: RegExp, detailOnlyText?: string) {
  await expect(page).toHaveURL(urlPattern);

  const basicData = page.getByText('البيانات الأساسية').first();
  const loadError = page.getByText('تعذّر تحميل السجل').first();
  await expect(basicData.or(loadError)).toBeVisible();

  if (detailOnlyText && await basicData.isVisible().catch(() => false)) {
    await expect(page.getByText(detailOnlyText)).toBeVisible();
  }
}

test('a business challenge record route opens and shows content or an app error state', async ({ page }) => {
  const opened = await openFirstRecord(page, '/dashboards/business-challenges', '/records/business-challenges/');
  if (!opened) return;
  await expectRecordContentOrLoadError(page, /\/records\/business-challenges\//, 'مسار التحدي في منظومة الابتكار');
});

test('a campaign record route opens and shows content or an app error state', async ({ page }) => {
  const opened = await openFirstRecord(page, '/dashboards/campaigns', '/records/campaigns/');
  if (!opened) return;
  await expectRecordContentOrLoadError(page, /\/records\/campaigns\//);
});

test('a protected business challenge detail keeps a return url and opens editing when available', async ({ page }) => {
  const opened = await openFirstRecord(page, '/dashboards/business-challenges', '/records/business-challenges/');
  if (!opened) return;

  if (/\/login\?next=/.test(page.url())) {
    await expect(page).toHaveURL(/\/login\?next=%2Frecords%2Fbusiness-challenges%2F/);
    return;
  }

  await expectRecordContentOrLoadError(page, /\/records\/business-challenges\//);

  if (await page.getByText('تعذّر تحميل السجل').first().isVisible().catch(() => false)) {
    return;
  }

  const editBtn = page.getByRole('button', { name: 'تعديل' });
  if (await editBtn.count()) {
    await editBtn.first().click();
    await expect(page.locator('form').getByText('مصدر التحدي').first()).toBeVisible();
    await page.getByRole('button', { name: 'إلغاء' }).click();
  }
});
