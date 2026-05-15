/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Limitations:
 *   - State is per-process, so on serverless platforms each cold-start lambda
 *     has an independent counter. Acceptable for "reduce abuse" but NOT for
 *     hard guarantees. Replace with @upstash/ratelimit + Redis when a quota
 *     SLA is required.
 *   - Memory bounded by aggressive eviction of expired entries.
 *
 * Disabled when RATE_LIMIT_ENABLED is not 'true'.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const ENABLED = process.env.RATE_LIMIT_ENABLED === 'true';

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds
}

export function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  if (!ENABLED) return { ok: true, remaining: opts.limit, retryAfter: 0 };

  const now = Date.now();
  const existing = buckets.get(opts.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    if (buckets.size > 10_000) evictExpired(now);
    return { ok: true, remaining: opts.limit - 1, retryAfter: 0 };
  }
  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { ok: true, remaining: opts.limit - existing.count, retryAfter: 0 };
}

function evictExpired(now: number) {
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export function getClientKey(req: Request, prefix: string): string {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:${ip}`;
}
