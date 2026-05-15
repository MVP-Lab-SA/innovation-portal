import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'momah.gov.sa,gov.sa').split(',').map(d => d.trim().toLowerCase());
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
    }),
  ],
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  callbacks: {
    async signIn({ user }) {
      const email = (user.email || '').toLowerCase();
      if (!email) return false;
      if (ALLOWED_EMAILS.length > 0 && ALLOWED_EMAILS.includes(email)) return true;
      const domain = email.split('@')[1];
      if (domain && ALLOWED_DOMAINS.includes(domain)) return true;
      if (email === ADMIN_EMAIL) return true;
      if (process.env.NODE_ENV === 'development') return true;
      return false;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, active: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.userId = dbUser.id;
          token.active = dbUser.active;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).role = token.role;
        (session.user as any).active = token.active;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: { lastLoginAt: new Date() },
        }).catch(() => {});
      }
    },
  },
};

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export function canEdit(role?: string): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export function canAdmin(role?: string): boolean {
  return role === 'ADMIN';
}
