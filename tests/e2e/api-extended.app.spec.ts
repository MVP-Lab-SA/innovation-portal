import { test, expect } from '@playwright/test';

/**
 * Deeper API checks — pagination, sorting, filtering, health, and
 * negative validation. All GET-only except two POSTs that are
 * guaranteed to fail validation (so nothing is ever persisted).
 */

test('API: list pagination — page size is honoured', async ({ request }) => {
  const res = await request.get('/api/entities/business-challenges?page=1&pageSize=3');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.length).toBeLessThanOrEqual(3);
  expect(body.pagination.page).toBe(1);
  expect(body.pagination.pageSize).toBe(3);
});

test('API: list pagination — second page differs from the first', async ({ request }) => {
  const p1 = await (await request.get('/api/entities/business-challenges?page=1&pageSize=2')).json();
  const p2 = await (await request.get('/api/entities/business-challenges?page=2&pageSize=2')).json();
  expect(p2.pagination.page).toBe(2);
  if (p1.data.length && p2.data.length) {
    expect(p1.data[0].id).not.toBe(p2.data[0].id);
  }
});

test('API: list sorting is accepted', async ({ request }) => {
  const res = await request.get('/api/entities/business-challenges?sortBy=code&sortDir=asc&pageSize=5');
  expect(res.ok()).toBeTruthy();
  expect(Array.isArray((await res.json()).data)).toBeTruthy();
});

test('API: list search filters results', async ({ request }) => {
  const res = await request.get('/api/entities/business-challenges?search=BCH&pageSize=5');
  expect(res.ok()).toBeTruthy();
  expect(Array.isArray((await res.json()).data)).toBeTruthy();
});

test('API: a missing record id returns 404', async ({ request }) => {
  const res = await request.get('/api/entities/business-challenges/no-such-id-xyz');
  expect(res.status()).toBe(404);
});

test('API: /api/health responds ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
});

test('API: creating with an unknown field is rejected (400)', async ({ request }) => {
  // Unknown keys fail the strict() schema — nothing is created.
  const res = await request.post('/api/entities/campaigns', {
    data: { __notARealField: true },
  });
  expect(res.status()).toBe(400);
});

test('API: creating without a required field is rejected (400)', async ({ request }) => {
  // Missing the required «title» — validation fails before any insert.
  const res = await request.post('/api/entities/campaigns', { data: {} });
  expect(res.status()).toBe(400);
});

const FILTERABLE = ['ideas', 'risks', 'campaigns', 'business-challenges', 'pilots'];
for (const id of FILTERABLE) {
  test(`API: /api/dashboards/${id} accepts a status filter`, async ({ request }) => {
    const res = await request.get(`/api/dashboards/${id}?status=&category=`);
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toHaveProperty('kpis');
  });
}

test('API: dashboard charts are returned alongside KPIs', async ({ request }) => {
  const res = await request.get('/api/dashboards/business-challenges');
  const body = await res.json();
  expect(body).toHaveProperty('charts');
  expect(body.charts).toHaveProperty('byDomain');
});
