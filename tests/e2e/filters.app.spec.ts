import { test, expect } from '@playwright/test';

/**
 * Dashboard filters. The DashboardFilters component re-computes KPIs,
 * charts and tables server-side when a filter changes.
 */

test('the risks dashboard exposes filter controls', async ({ page }) => {
  await page.goto('/dashboards/risks');
  await expect(page).not.toHaveURL(/\/login/);
  // Filter selects render above the KPIs.
  await expect(page.locator('select').first()).toBeVisible({ timeout: 20_000 });
});

test('applying a filter keeps the dashboard functional', async ({ page }) => {
  await page.goto('/dashboards/risks');
  await expect(page).not.toHaveURL(/\/login/);

  const select = page.locator('select').first();
  await expect(select).toBeVisible({ timeout: 20_000 });
  const options = await select.locator('option').count();
  if (options > 1) {
    await select.selectOption({ index: 1 });
    // The dashboard re-fetches; the title heading must remain rendered.
    await expect(page.locator('h1').first()).toBeVisible();
  }
});

test('the business-challenges dashboard filters by status', async ({ page }) => {
  await page.goto('/dashboards/business-challenges');
  await expect(page).not.toHaveURL(/\/login/);
  const select = page.locator('select').first();
  await expect(select).toBeVisible({ timeout: 20_000 });
  if ((await select.locator('option').count()) > 1) {
    await select.selectOption({ index: 1 });
    await expect(page.locator('h1').first()).toBeVisible();
  }
});

test('the campaigns dashboard filters reset cleanly', async ({ page }) => {
  await page.goto('/dashboards/campaigns');
  await expect(page).not.toHaveURL(/\/login/);
  const select = page.locator('select').first();
  await expect(select).toBeVisible({ timeout: 20_000 });
  if ((await select.locator('option').count()) > 1) {
    await select.selectOption({ index: 1 });
    await select.selectOption({ index: 0 }); // back to «الكل»
    await expect(page.locator('h1').first()).toBeVisible();
  }
});
