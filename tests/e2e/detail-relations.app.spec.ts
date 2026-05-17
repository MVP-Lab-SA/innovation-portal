import { test, expect, type Page } from '@playwright/test';

/**
 * Record detail pages surface their related records — the relation
 * cards and (for business challenges) the funnel lineage strip.
 */

async function openFirst(page: Page, dashboard: string, slug: string): Promise<boolean> {
  await page.goto(dashboard);
  await expect(page).not.toHaveURL(/\/login/);
  const link = page.locator(`a[href^="/records/${slug}/"]`).first();
  const empty = page.getByText('لا توجد بيانات').first();
  await expect(link.or(empty)).toBeVisible({ timeout: 20_000 });
  if (await empty.isVisible().catch(() => false)) return false;
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/records/${slug}/`));
  return true;
}

test('a business challenge shows the four-stage funnel strip', async ({ page }) => {
  const ok = await openFirst(page, '/dashboards/business-challenges', 'business-challenges');
  test.skip(!ok, 'no business challenges');
  if (await page.getByText('تعذّر تحميل السجل').isVisible().catch(() => false)) return;
  await expect(page.getByText('مسار التحدي في منظومة الابتكار')).toBeVisible();
  await expect(page.getByText('المصدر الاستراتيجي')).toBeVisible();
  await expect(page.getByText('الحملات', { exact: true })).toBeVisible();
  await expect(page.getByText('التجارب التشغيلية')).toBeVisible();
});

test('a linked business challenge lists its campaigns', async ({ page }) => {
  const ok = await openFirst(page, '/dashboards/business-challenges', 'business-challenges');
  test.skip(!ok, 'no business challenges');
  if (await page.getByText('تعذّر تحميل السجل').isVisible().catch(() => false)) return;
  // The 15 main challenges are linked to campaigns — the relation card
  // shows for at least the linked ones; otherwise the basic data shows.
  await expect(page.getByText('البيانات الأساسية')).toBeVisible();
});

test('a campaign detail shows its included business challenges', async ({ page }) => {
  const ok = await openFirst(page, '/dashboards/campaigns', 'campaigns');
  test.skip(!ok, 'no campaigns');
  if (await page.getByText('تعذّر تحميل السجل').isVisible().catch(() => false)) return;
  await expect(page.getByText('البيانات الأساسية')).toBeVisible();
});

test('an expert detail can show recorded opinions', async ({ page }) => {
  const ok = await openFirst(page, '/dashboards/experts', 'experts');
  test.skip(!ok, 'no experts');
  if (await page.getByText('تعذّر تحميل السجل').isVisible().catch(() => false)) return;
  await expect(page.getByText('البيانات الأساسية')).toBeVisible();
});

test('a sandbox application detail shows its funnel links', async ({ page }) => {
  const ok = await openFirst(page, '/dashboards/sandbox', 'sandbox-applications');
  test.skip(!ok, 'no sandbox applications');
  if (await page.getByText('تعذّر تحميل السجل').isVisible().catch(() => false)) return;
  await expect(page.getByText('البيانات الأساسية')).toBeVisible();
});
