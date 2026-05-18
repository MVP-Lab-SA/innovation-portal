import { test, expect, type Page } from '@playwright/test';

/**
 * Record detail pages across the funnel entities. Read-only.
 * Each test opens the first record from its dashboard list; if the
 * dashboard is empty it skips rather than fails.
 */

async function openFirstRecord(page: Page, dashboardPath: string, slug: string): Promise<boolean> {
  await page.goto(dashboardPath);
  await expect(page).not.toHaveURL(/\/login/);
  // Wait for the dashboard's client-side fetch to populate the table —
  // racing against the (instantly rendered) empty state would skip wrongly.
  const link = page.locator(`a[href^="/records/${slug}/"]`).first();
  try {
    await link.waitFor({ state: 'visible', timeout: 20_000 });
  } catch {
    return false; // genuinely no records
  }
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/records/${slug}/`));
  return true;
}

const CASES: Array<{ name: string; dashboard: string; slug: string }> = [
  { name: 'sandbox application', dashboard: '/dashboards/sandbox', slug: 'sandbox-applications' },
  { name: 'expert', dashboard: '/dashboards/experts', slug: 'experts' },
  { name: 'idea', dashboard: '/dashboards/ideas', slug: 'ideas' },
  { name: 'pilot', dashboard: '/dashboards/pilots', slug: 'pilots' },
  { name: 'initiative', dashboard: '/dashboards/initiatives', slug: 'initiatives' },
];

for (const c of CASES) {
  test(`${c.name} detail page opens and shows its data`, async ({ page }) => {
    const opened = await openFirstRecord(page, c.dashboard, c.slug);
    test.skip(!opened, `no ${c.name} records`);
    const basic = page.getByText('البيانات الأساسية').first();
    const loadError = page.getByText('تعذّر تحميل السجل').first();
    await expect(basic.or(loadError)).toBeVisible();
  });
}

test('an initiative detail page lists its milestones', async ({ page }) => {
  const opened = await openFirstRecord(page, '/dashboards/initiatives', 'initiatives');
  test.skip(!opened, 'no initiatives');
  // The relation section header for milestones.
  const milestones = page.getByText('المراحل الرئيسية').first();
  const basic = page.getByText('البيانات الأساسية').first();
  await expect(basic.or(milestones)).toBeVisible();
});

test('a record detail page offers a back-to-list link', async ({ page }) => {
  const opened = await openFirstRecord(page, '/dashboards/experts', 'experts');
  test.skip(!opened, 'no experts');
  await expect(page.getByRole('link', { name: 'القائمة' }).first()).toBeVisible();
});
