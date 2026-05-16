const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';

const routes = [
  '/',
  '/login',
  '/auth/email-otp',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/dashboards/executive',
  '/dashboards/ideas',
  '/dashboards/challenges',
  '/dashboards/sandbox',
  '/dashboards/pilots',
  '/dashboards/initiatives',
  '/dashboards/partners',
  '/dashboards/risks',
  '/dashboards/metrics',
  '/dashboards/communications',
  '/admin/data',
  '/admin/users',
  '/admin/lookups',
  '/admin/audit-log',
];

const failures = [];
for (const route of routes) {
  const url = new URL(route, baseUrl).toString();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (response.status >= 500) {
      failures.push(`${route}: ${response.status}`);
      continue;
    }
    const text = await response.text();
    if (/Internal Server Error|Application error|ReferenceError|TypeError/i.test(text)) {
      failures.push(`${route}: runtime-error-signature`);
    }
  } catch (error) {
    failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  console.error('[smoke-routes] FAILED');
  for (const failure of failures) console.error(' -', failure);
  process.exit(1);
}

console.log(`[smoke-routes] OK (${routes.length} routes)`);