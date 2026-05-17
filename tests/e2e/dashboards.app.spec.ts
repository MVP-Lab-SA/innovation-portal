import { test, expect } from '@playwright/test';

/**
 * Every analytics dashboard loads for an authenticated user — funnel
 * order: source → business challenges → campaigns → ideas/sandbox →
 * pilots/evaluations → initiatives, then supporting domains.
 */
const DASHBOARDS = [
  'executive', 'strategic-sources', 'business-challenges', 'campaigns',
  'ideas', 'sandbox', 'evaluations', 'pilots', 'initiatives', 'milestones',
  'partners', 'sponsorships', 'partner-interactions', 'experts', 'risks',
  'metrics', 'communications', 'documents', 'events', 'cems',
];

for (const slug of DASHBOARDS) {
  test(`dashboard /dashboards/${slug} loads`, async ({ page }) => {
    await page.goto(`/dashboards/${slug}`);
    // Authenticated → never bounced to the login wall.
    await expect(page).not.toHaveURL(/\/login/);
    // AppShell always renders the page title as an <h1>.
    await expect(page.locator('h1').first()).toBeVisible();
  });
}

test('the executive dashboard shows KPI figures', async ({ page }) => {
  await page.goto('/dashboards/executive');
  await expect(page).not.toHaveURL(/\/login/);
  // KPI cards render their Arabic labels.
  await expect(page.getByText('إجمالي الأفكار')).toBeVisible();
  await expect(page.getByRole('main').getByText('الحملات', { exact: true })).toBeVisible();
});

test('the business-challenges dashboard lists records', async ({ page }) => {
  await page.goto('/dashboards/business-challenges');
  await expect(page).not.toHaveURL(/\/login/);
  const firstRecordLink = page.locator('a[href^="/records/business-challenges/"]').first();
  const emptyState = page.getByText('لا توجد بيانات').first();
  await expect(firstRecordLink.or(emptyState)).toBeVisible();
});

test('the campaigns dashboard shows the delivery-method chart', async ({ page }) => {
  await page.goto('/dashboards/campaigns');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByText('طرق التنفيذ')).toBeVisible();
});
