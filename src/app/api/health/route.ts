import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health & configuration check endpoint.
 * Returns which features are configured WITHOUT exposing secrets.
 * Useful for debugging deployment issues.
 */
export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    region: process.env.VERCEL_REGION || 'unknown',
    
    // Database
    database: {
      configured: !!(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL),
      pooled_url: !!process.env.POSTGRES_PRISMA_URL,
      direct_url: !!process.env.POSTGRES_URL_NON_POOLING,
    },
    
    // Blob storage
    blob: {
      configured: !!process.env.BLOB_READ_WRITE_TOKEN,
    },
    
    // Authentication
    auth: {
      nextauth_url: !!process.env.NEXTAUTH_URL,
      nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      google_oauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      email_resend: !!process.env.RESEND_API_KEY,
    },
    
    // Authorization
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
      
      // Try to count users (if schema is migrated)
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

  return NextResponse.json({
    status: 'ok',
    ...status,
    database_runtime: dbStatus,
  });
}
