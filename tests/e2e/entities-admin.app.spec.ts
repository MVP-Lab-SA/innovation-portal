import { test, expect } from '@playwright/test';

/**
 * Every managed entity opens in the generic /admin/data CRUD surface
 * without an "unknown entity" error — a fast guard against a broken or
 * unregistered ENTITY_CONFIG.
 */
const ENTITIES = [
  'employees', 'initiatives', 'milestones', 'tasks', 'experts',
  'expert-opinions', 'ideas', 'sandbox-applications', 'pilots',
  'evaluations', 'eval-rubrics', 'calendar-events', 'strategic-sources',
  'business-challenges', 'campaigns', 'campaign-business-challenges',
  'cems', 'partners', 'sponsorships', 'partner-interactions', 'documents',
  'risks', 'metrics', 'communications', 'idea-expert-assignments',
  'initiative-partners', 'expert-challenge-assignments',
];

for (const slug of ENTITIES) {
  test(`admin: entity "${slug}" is registered and opens`, async ({ page }) => {
    await page.goto(`/admin/data?entity=${slug}`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('h1').first()).toBeVisible();
    // A registered entity never shows the "unknown entity" message.
    await expect(page.getByText(/غير معرّف|غير معروف/)).toHaveCount(0);
    // It renders either its data table, or its empty-state.
    const table = page.locator('table').first();
    const empty = page.getByText(/لا توجد/).first();
    await expect(table.or(empty)).toBeVisible({ timeout: 20_000 });
  });
}
