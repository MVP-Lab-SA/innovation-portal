import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public liveness check. Returns only status + timestamp.
 * Configuration & subsystem details live behind /api/health/details (admin-only).
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', ts: new Date().toISOString() });
}
