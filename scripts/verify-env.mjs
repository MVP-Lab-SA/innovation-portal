const required = [
  'NEON_AUTH_BASE_URL',
  'NEON_AUTH_COOKIE_SECRET',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'ADMIN_EMAIL',
  'ALLOWED_DOMAINS',
];

const optionalRecommended = [
  'BLOB_READ_WRITE_TOKEN',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error('[env-check] Missing required env vars:', missing.join(', '));
  process.exit(1);
}

const secret = process.env.NEON_AUTH_COOKIE_SECRET || '';
if (secret.length < 32) {
  console.error('[env-check] NEON_AUTH_COOKIE_SECRET must be at least 32 characters.');
  process.exit(1);
}

const missingOptional = optionalRecommended.filter((name) => !process.env[name]);
if (missingOptional.length) {
  console.warn('[env-check] Missing recommended env vars:', missingOptional.join(', '));
}

console.log('[env-check] OK');