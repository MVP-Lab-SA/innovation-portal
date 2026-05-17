import { test, expect } from '@playwright/test';

/**
 * Dashboards render their Recharts visualisations. Recharts mounts a
 * `.recharts-wrapper` once the dashboard data has loaded.
 */

const DASHBOARDS_WITH_CHARTS = [
  'executive', 'business-challenges', 'campaigns', 'risks', 'ideas',
  'sandbox', 'partners',
];

for (const slug of DASHBOARDS_WITH_CHARTS) {
  test(`/dashboards/${slug} renders charts`, async ({ page }) => {
    await page.goto(`/dashboards/${slug}`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 20_000 });
  });
}

test('the executive dashboard renders multiple charts', async ({ page }) => {
  await page.goto('/dashboards/executive');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 20_000 });
  expect(await page.locator('.recharts-wrapper').count()).toBeGreaterThan(1);
});
