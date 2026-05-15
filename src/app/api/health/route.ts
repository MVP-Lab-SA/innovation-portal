import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public health & configuration check.
 * Returns which features are configured WITHOUT exposing secrets.
 * Useful for debugging deployment issues.
 * 
 * NOTE: This endpoint is unprotected for diagnostics.
 */
export async function GET() {
  const status: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    region: process.env.VERCEL_REGION || 'unknown',
    
    database: {
      configured: !!(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL),
      pooled_url: !!process.env.POSTGRES_PRISMA_URL,
      direct_url: !!process.env.POSTGRES_URL_NON_POOLING,
    },
    
    blob: {
      configured: !!process.env.BLOB_READ_WRITE_TOKEN,
    },
    
    sanity: {
      configured: !!(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID),
      project_id: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || null,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || null,
      read_token: !!process.env.SANITY_API_READ_TOKEN,
    },
    
    auth: {
      nextauth_url: !!process.env.NEXTAUTH_URL,
      nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      google_oauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      email_resend: !!process.env.RESEND_API_KEY,
    },
    
    authorization: {
      admin_email_set: !!process.env.ADMIN_EMAIL,
      allowed_domains: (process.env.ALLOWED_DOMAINS || '').split(',').filter(Boolean).length,
      allowed_emails: (process.env.ALLOWED_EMAILS || '').split(',').filter(Boolean).length,
    },
  };

  // Test database connection
  let dbStatus: any = { connected: false };
  if (status.database.configured) {
    try {
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      dbStatus.connected = true;
      
      try {
        const userCount = await prisma.user.count();
        const lookupCount = await prisma.lookup.count();
        dbStatus.schema_migrated = true;
        dbStatus.users = userCount;
        dbStatus.lookups = lookupCount;
      } catch {
        dbStatus.schema_migrated = false;
      }
    } catch (e: any) {
      dbStatus.error = e.message;
    }
  }

  // Warnings
  const warnings: string[] = [];
  if (!status.auth.nextauth_secret) warnings.push('❌ NEXTAUTH_SECRET not set - login WILL FAIL');
  if (!status.auth.nextauth_url) warnings.push('⚠️  NEXTAUTH_URL not set');
  if (!status.auth.email_resend && !status.auth.google_oauth) warnings.push('⚠️  No auth providers configured (need Resend or Google)');
  if (!status.database.configured) warnings.push('❌ Database not configured');

  return NextResponse.json({
    status: warnings.length === 0 ? 'ok' : 'warning',
    warnings,
    ...status,
    database_runtime: dbStatus,
  });
}
