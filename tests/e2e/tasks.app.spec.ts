import { test, expect } from '@playwright/test';

/** The operational tasks board. Read-only — no drag/status changes. */

test('the tasks board page loads', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the tasks board shows status columns or content', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).not.toHaveURL(/\/login/);
  // Columns derive from the TaskStatus lookup; «جديدة» is a standard value.
  const column = page.getByText('جديدة').first();
  const empty = page.getByText(/لا توجد|لا يوجد/).first();
  if (await column.count()) {
    await expect(column).toBeVisible({ timeout: 20_000 });
    return;
  }

  await expect(empty).toBeVisible({ timeout: 20_000 });
});

test('a task card links into its record detail page', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).not.toHaveURL(/\/login/);
  const card = page.locator('a[href^="/records/tasks/"]').first();
  const empty = page.getByText(/لا توجد|لا يوجد/).first();
  if (await card.count()) {
    await expect(card).toBeVisible({ timeout: 20_000 });
    return;
  }

  await expect(empty).toBeVisible({ timeout: 20_000 });
});
