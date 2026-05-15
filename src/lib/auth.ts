import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { Resend } from 'resend';
import { prisma } from './prisma';

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'momah.gov.sa,gov.sa')
  .split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

// Build providers dynamically — only enable those with credentials configured
function buildProviders() {
  const providers: any[] = [];

  // Google OAuth (optional)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
        },
      })
    );
  }

  // Email Magic Links via Resend (recommended - simpler setup)
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    providers.push(
      EmailProvider({
        from: emailFrom,
        sendVerificationRequest: async ({ identifier, url }) => {
          try {
            await resend.emails.send({
              from: emailFrom,
              to: identifier,
              subject: 'تسجيل الدخول إلى مركز الابتكار',
              html: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تسجيل الدخول</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; background: #FAFAF7; padding: 40px 20px; color: #2C2C2A;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #006C67 0%, #004F4B 100%); padding: 32px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">مركز الابتكار وحلول الأعمال</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">وزارة البلديات والإسكان</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="margin: 0 0 16px; color: #004F4B; font-size: 20px;">تسجيل الدخول الآمن</h2>
      <p style="margin: 0 0 24px; line-height: 1.7; color: #5F5F5C;">
        مرحباً،<br><br>
        تم طلب تسجيل الدخول إلى حسابك في مركز الابتكار. اضغط الزر أدناه لإكمال تسجيل الدخول.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${url}" style="display: inline-block; background: #006C67; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
          تسجيل الدخول →
        </a>
      </div>
      <p style="margin: 24px 0 0; padding: 16px; background: #F0F7F5; border-radius: 8px; font-size: 13px; color: #5F5F5C;">
        🔒 هذا الرابط صالح لمرة واحدة فقط ولمدة 24 ساعة. إن لم تطلب تسجيل الدخول، يمكنك تجاهل هذه الرسالة.
      </p>
    </div>
    <div style="padding: 20px; background: #F7F7F4; text-align: center; font-size: 12px; color: #8A8A85;">
      © 2026 مركز الابتكار وحلول الأعمال
    </div>
  </div>
</body>
</html>
              `,
              text: `مرحباً،\n\nاضغط الرابط التالي لتسجيل الدخول إلى مركز الابتكار:\n\n${url}\n\nصالح لمدة 24 ساعة.`,
            });
          } catch (error: any) {
            console.error('Resend send error:', error);
            throw new Error('فشل إرسال البريد الإلكتروني');
          }
        },
      })
    );
  }

  return providers;
}

// CRITICAL: Validate or generate a build-time fallback secret.
// In production, NEXTAUTH_SECRET must be set as an env var.
// This fallback prevents app crashes during initial deployment.
const NEXTAUTH_SECRET_FALLBACK = 'INSECURE_FALLBACK_REPLACE_IN_PRODUCTION_xK7vMpQ2rN8sB4cY6jL1wF9hT3uX5dG0';

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️ CRITICAL: NEXTAUTH_SECRET is not set. Using insecure fallback. SET THIS IN VERCEL IMMEDIATELY!');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: buildProviders(),
  pages: { signIn: '/login', error: '/login', verifyRequest: '/login?check-email=1' },
  session: { strategy: 'database', maxAge: 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET || NEXTAUTH_SECRET_FALLBACK,
  callbacks: {
    async signIn({ user }) {
      const email = (user.email || '').toLowerCase();
      if (!email) return false;

      // Explicit allowlist
      if (ALLOWED_EMAILS.length > 0 && ALLOWED_EMAILS.includes(email)) return true;

      // Domain allowlist
      const domain = email.split('@')[1];
      if (domain && ALLOWED_DOMAINS.includes(domain)) return true;

      // Admin always allowed
      if (email === ADMIN_EMAIL) return true;

      // In development, allow all
      if (process.env.NODE_ENV === 'development') return true;

      return false;
    },
    async session({ session, user }) {
      if (session.user && user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true, active: true },
        });
        (session.user as any).id = user.id;
        (session.user as any).role = dbUser?.role || 'VIEWER';
        (session.user as any).active = dbUser?.active ?? true;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;

      // Auto-promote first user (admin email) to ADMIN role
      const email = user.email.toLowerCase();
      const isAdmin = email === ADMIN_EMAIL;

      await prisma.user.update({
        where: { email: user.email },
        data: {
          lastLoginAt: new Date(),
          ...(isAdmin && { role: 'ADMIN' }),
        },
      }).catch(() => {});
    },
  },
};

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';
export function canEdit(role?: string): boolean { return role === 'ADMIN' || role === 'EDITOR'; }
export function canAdmin(role?: string): boolean { return role === 'ADMIN'; }
