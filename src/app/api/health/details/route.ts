import { NextResponse } from 'next/server';
import { getSessionWithProfile, canAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin-only diagnostics: real subsystem probes + configuration flags.
 * Never expose this to unauthenticated users — it leaks the deployment topology.
 */
export async function GET() {
  const session = await getSessionWithProfile();
  if (!session?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canAdmin(session.profile.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const config = {
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    region: process.env.VERCEL_REGION || 'unknown',
    database: {
      pooled_url: !!process.env.POSTGRES_PRISMA_URL,
      direct_url: !!process.env.POSTGRES_URL_NON_POOLING,
    },
    blob: { configured: !!process.env.BLOB_READ_WRITE_TOKEN },
    sanity: {
      project_id_set: !!(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID),
      dataset_set: !!process.env.NEXT_PUBLIC_SANITY_DATASET,
      read_token: !!process.env.SANITY_API_READ_TOKEN,
    },
    auth: {
      neon_auth_url: !!process.env.NEON_AUTH_BASE_URL,
      cookie_secret: !!(process.env.NEON_AUTH_COOKIE_SECRET || process.env.NEXTAUTH_SECRET),
      google_oauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    authorization: {
      admin_email_set: !!process.env.ADMIN_EMAIL,
      allowed_domains: (process.env.ALLOWED_DOMAINS || '').split(',').filter(Boolean).length,
      allowed_emails: (process.env.ALLOWED_EMAILS || '').split(',').filter(Boolean).length,
    },
  };

  const probes: Record<string, { ok: boolean; error?: string; latencyMs?: number }> = {};

  // Database probe
  probes.database = await timed(async () => {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
  });

  // Sanity probe (HEAD against project CDN)
  if (config.sanity.project_id_set) {
    probes.sanity = await timed(async () => {
      const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
      const url = `https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=*[_type=="post"][0]`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`sanity ${res.status}`);
    });
  } else {
    probes.sanity = { ok: false, error: 'not_configured' };
  }

  // Blob probe (list with very small limit)
  if (config.blob.configured) {
    probes.blob = await timed(async () => {
      const { list } = await import('@vercel/blob');
      await list({ limit: 1 });
    });
  } else {
    probes.blob = { ok: false, error: 'not_configured' };
  }

  return NextResponse.json({
    status: Object.values(probes).every(p => p.ok) ? 'ok' : 'degraded',
    ts: new Date().toISOString(),
    config,
    probes,
  });
}

async function timed(fn: () => Promise<unknown>) {
  const start = Date.now();
  try {
    await fn();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
    };
  }
}
