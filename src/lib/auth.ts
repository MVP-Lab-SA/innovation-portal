import { createNeonAuth } from '@neondatabase/auth/next/server';
import type { UserRole } from '@prisma/client';

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'momah.gov.sa,gov.sa')
  .split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL || '';
const NEON_AUTH_COOKIE_SECRET = process.env.NEON_AUTH_COOKIE_SECRET || process.env.NEXTAUTH_SECRET || '';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

// Log critical misconfiguration loudly but DO NOT throw at module load — a
// throw here crashes every route, not just /api/auth/*. The auth handler
// itself will fail visibly when actually invoked without proper config.
if (IS_PRODUCTION && !IS_BUILD) {
  if (!NEON_AUTH_BASE_URL) {
    console.error('[CONFIG] NEON_AUTH_BASE_URL is not set in production. Auth will fail.');
  }
  if (!NEON_AUTH_COOKIE_SECRET) {
    console.error('[CONFIG] NEON_AUTH_COOKIE_SECRET (or NEXTAUTH_SECRET) is not set in production. Sessions WILL NOT WORK.');
  } else if (NEON_AUTH_COOKIE_SECRET.length < 32) {
    console.warn('[CONFIG] NEON_AUTH_COOKIE_SECRET is shorter than 32 chars — recommended >=32 for prod.');
  }
}

// Stable per-process random fallback so the module always initializes. In
// production this is only reached when the operator forgot to set the env
// var; the critical-config logs above will explain the misconfig.
const FALLBACK_COOKIE_SECRET = NEON_AUTH_COOKIE_SECRET
  || `fallback-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

export const auth = createNeonAuth({
  baseUrl: NEON_AUTH_BASE_URL,
  cookies: {
    secret: NEON_AUTH_COOKIE_SECRET || FALLBACK_COOKIE_SECRET,
  },
});

export type Role = UserRole;

/** Allowlist check — emails admin/allowed/domain are accepted. No NODE_ENV bypass. */
export function isAllowedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (ALLOWED_EMAILS.includes(lower)) return true;
  const domain = lower.split('@')[1];
  if (domain && ALLOWED_DOMAINS.includes(domain)) return true;
  if (ADMIN_EMAIL && lower === ADMIN_EMAIL) return true;
  // Explicit opt-in for local development (must be set deliberately, never in prod).
  if (!IS_PRODUCTION && process.env.DEV_ALLOW_ANY_EMAIL === 'true') return true;
  return false;
}

/**
 * Get current session with profile (role) information.
 * Auto-syncs Neon Auth user to our local User profile on first access.
 */
export async function getSessionWithProfile() {
  try {
    const { prisma } = await import('./prisma');
    const { data: session } = await auth.getSession();
    if (!session?.user) return null;

    const email = session.user.email?.toLowerCase();
    if (!email) return null;

    if (!isAllowedEmail(email)) {
      return { session, profile: null, allowed: false };
    }

    const isFirstAdmin = ADMIN_EMAIL && email === ADMIN_EMAIL;
    const profile = await syncUserProfile({
      prisma,
      email,
      isFirstAdmin,
      sessionUser: session.user,
    });

    return { session, profile, allowed: true };
  } catch (error) {
    console.error('session_error', error);
    return null;
  }
}

async function syncUserProfile({
  prisma,
  email,
  isFirstAdmin,
  sessionUser,
}: {
  prisma: Awaited<typeof import('./prisma')>['prisma'];
  email: string;
  isFirstAdmin: boolean | '';
  sessionUser: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    try {
      return await prisma.user.update({
        where: { email },
        data: {
          lastLoginAt: new Date(),
          name: sessionUser.name || existing.name || undefined,
          image: sessionUser.image || existing.image || undefined,
          neonAuthId: existing.neonAuthId || sessionUser.id,
          ...(isFirstAdmin && { role: 'ADMIN', active: true }),
        },
      });
    } catch (error) {
      console.warn('profile_sync_update_failed', { email, error });
      return existing;
    }
  }

  try {
    return await prisma.user.create({
      data: {
        email,
        name: sessionUser.name || email.split('@')[0],
        image: sessionUser.image,
        neonAuthId: sessionUser.id,
        role: isFirstAdmin ? 'ADMIN' : 'VIEWER',
        active: true,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    console.warn('profile_sync_create_failed', { email, error });
    const fallback = await prisma.user.findUnique({ where: { email } });
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

export function canEdit(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}
export function canAdmin(role?: string | null): boolean {
  return role === 'ADMIN';
}

export function isNeonAuthConfigured(): boolean {
  return !!NEON_AUTH_BASE_URL;
}

/**
 * Per-entity access matrix.
 * Returns true when (role, entity, action) is allowed.
 * Defaults: VIEWER read-only on safe entities; EDITOR can write most; ADMIN-only on
 * sensitive ones (User, AuditLog). Update this matrix when adding new entities.
 */
type CrudAction = 'read' | 'create' | 'update' | 'delete';
const ADMIN_ONLY_ENTITIES = new Set([
  'users', 'user',
  'audit-log', 'auditLog',
]);
const ADMIN_OR_EDITOR_READ_ENTITIES = new Set([
  // PII-bearing — keep out of VIEWER
  'employees', 'employee',
  'experts', 'expert',
  'cems', 'cem',
  'sandbox-applications', 'sandboxApplication',
]);

export function canAccess(
  role: string | null | undefined,
  entity: string,
  action: CrudAction,
): boolean {
  if (!role) return false;
  if (ADMIN_ONLY_ENTITIES.has(entity)) return role === 'ADMIN';
  if (action === 'delete') return role === 'ADMIN';
  if (action === 'create' || action === 'update') return canEdit(role);
  // read
  if (ADMIN_OR_EDITOR_READ_ENTITIES.has(entity)) return canEdit(role);
  return true;
}
