import { createNeonAuth } from '@neondatabase/auth/next/server';
import { prisma } from './prisma';
import type { UserRole } from '@prisma/client';

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'momah.gov.sa,gov.sa')
  .split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL || '';
const NEON_AUTH_COOKIE_SECRET = process.env.NEON_AUTH_COOKIE_SECRET 
  || process.env.NEXTAUTH_SECRET 
  || 'INSECURE_FALLBACK_xK7vMpQ2rN8sB4cY6jL1wF9hT3uX5dG0';

if (!NEON_AUTH_BASE_URL && process.env.NODE_ENV === 'production') {
  console.error('⚠️ NEON_AUTH_BASE_URL is not set. Auth will fail.');
}

/**
 * Neon Auth server instance.
 * Provides: handler(), middleware(), getSession(), signIn, signOut, etc.
 */
export const auth = createNeonAuth({
  baseUrl: NEON_AUTH_BASE_URL,
  cookies: {
    secret: NEON_AUTH_COOKIE_SECRET,
  },
});

export type Role = UserRole;

/**
 * Check if user is allowed (allowlist check)
 */
export function isAllowedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (ALLOWED_EMAILS.includes(lower)) return true;
  const domain = lower.split('@')[1];
  if (domain && ALLOWED_DOMAINS.includes(domain)) return true;
  if (lower === ADMIN_EMAIL) return true;
  return process.env.NODE_ENV === 'development';
}

/**
 * Get current session with profile (role) information.
 * Auto-syncs Neon Auth user to our local User profile on first access.
 */
export async function getSessionWithProfile() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) return null;

    const email = session.user.email?.toLowerCase();
    if (!email) return null;

    // Check allowlist
    if (!isAllowedEmail(email)) {
      return { session, profile: null, allowed: false };
    }

    // Sync to our User table (creates profile on first login)
    const isFirstAdmin = email === ADMIN_EMAIL;
    const profile = await prisma.user.upsert({
      where: { email },
      update: {
        lastLoginAt: new Date(),
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        neonAuthId: session.user.id,
        ...(isFirstAdmin && { role: 'ADMIN', active: true }),
      },
      create: {
        email,
        name: session.user.name || email.split('@')[0],
        image: session.user.image,
        neonAuthId: session.user.id,
        role: isFirstAdmin ? 'ADMIN' : 'VIEWER',
        active: true,
        lastLoginAt: new Date(),
      },
    });

    return { session, profile, allowed: true };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

/** Authorization helpers */
export function canEdit(role?: string | null): boolean { 
  return role === 'ADMIN' || role === 'EDITOR'; 
}
export function canAdmin(role?: string | null): boolean { 
  return role === 'ADMIN'; 
}

/** Check if Neon Auth is configured */
export function isNeonAuthConfigured(): boolean {
  return !!NEON_AUTH_BASE_URL;
}
