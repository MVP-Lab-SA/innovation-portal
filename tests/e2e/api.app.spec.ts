import { test, expect } from '@playwright/test';

/**
 * API-level coverage for an authenticated session. Fast, stable, and
 * strictly read-only (GET) — verifies every backend endpoint the UI
 * depends on.
 */

const DASHBOARD_IDS = [
  'executive', 'ideas', 'campaigns', 'sandbox', 'pilots', 'initiatives',
  'partners', 'risks', 'metrics', 'communications', 'experts', 'documents',
  'events', 'cems', 'strategic-sources', 'sponsorships', 'evaluations',
  'milestones', 'partner-interactions', 'business-challenges',
];

for (const id of DASHBOARD_IDS) {
  test(`API: /api/dashboards/${id} returns KPIs`, async ({ request }) => {
    const res = await request.get(`/api/dashboards/${id}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('kpis');
    expect(typeof body.kpis).toBe('object');
  });
}

const ENTITIES = [
  'business-challenges', 'campaigns', 'campaign-business-challenges',
  'sandbox-applications', 'experts', 'expert-opinions', 'ideas', 'pilots',
  'initiatives', 'milestones', 'tasks', 'partners', 'risks', 'evaluations',
  'strategic-sources', 'documents', 'communications',
];

for (const e of ENTITIES) {
  test(`API: /api/entities/${e} lists records`, async ({ request }) => {
    const res = await request.get(`/api/entities/${e}?pageSize=5`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body).toHaveProperty('pagination');
  });
}

test('API: /api/me returns the signed-in profile', async ({ request }) => {
  const res = await request.get('/api/me');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body).toHaveProperty('role');
  expect(body).toHaveProperty('email');
});

test('API: /api/lookups returns category values', async ({ request }) => {
  const res = await request.get('/api/lookups?category=Priority');
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toHaveProperty('values');
});

test('API: /api/notifications responds', async ({ request }) => {
  const res = await request.get('/api/notifications');
  expect(res.ok()).toBeTruthy();
});

test('API: /api/search returns grouped results', async ({ request }) => {
  const res = await request.get('/api/search?q=تطوير');
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toHaveProperty('groups');
});

test('API: dashboard filters are accepted', async ({ request }) => {
  const res = await request.get('/api/dashboards/risks?status=مفتوحة');
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toHaveProperty('kpis');
});

test('API: an unknown dashboard id is 404', async ({ request }) => {
  const res = await request.get('/api/dashboards/not-a-dashboard');
  expect(res.status()).toBe(404);
});

test('API: an unknown entity is 404', async ({ request }) => {
  const res = await request.get('/api/entities/not-a-real-entity');
  expect(res.status()).toBe(404);
});

test('API: a single record can be fetched by id', async ({ request }) => {
  const list = await request.get('/api/entities/business-challenges?pageSize=1');
  const { data } = await list.json();
  test.skip(!data?.length, 'no business challenges to read');
  const res = await request.get(`/api/entities/business-challenges/${data[0].id}`);
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).id).toBe(data[0].id);
});

test('API: business challenges expose the funnel relations', async ({ request }) => {
  const list = await request.get('/api/entities/business-challenges?pageSize=1');
  const { data } = await list.json();
  test.skip(!data?.length, 'no business challenges to read');
  const res = await request.get(`/api/entities/business-challenges/${data[0].id}`);
  const body = await res.json();
  expect(body).toHaveProperty('campaignLinks');
  expect(body).toHaveProperty('pilots');
});
