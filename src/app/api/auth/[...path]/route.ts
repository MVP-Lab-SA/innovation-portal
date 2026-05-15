import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientKey } from '@/lib/rateLimit';

const inner = auth.handler();

type RouteCtx = { params: Promise<{ path: string[] }> };

async function guarded(
  req: NextRequest,
  ctx: RouteCtx,
  fn: (r: Request, c: RouteCtx) => Promise<Response>,
) {
  const limited = checkRateLimit({
    key: getClientKey(req, 'auth'),
    limit: 10,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfter: limited.retryAfter },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } },
    );
  }
  return fn(req, ctx);
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  return guarded(req, ctx, inner.GET as (r: Request, c: RouteCtx) => Promise<Response>);
}
export async function POST(req: NextRequest, ctx: RouteCtx) {
  return guarded(req, ctx, inner.POST as (r: Request, c: RouteCtx) => Promise<Response>);
}
