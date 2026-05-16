import { auth } from '@/lib/auth';

export default auth.middleware({
  loginUrl: '/login',
});

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login (auth page)
     * - /auth/* (Neon Auth UI pages)
     * - /api/auth/* (Neon Auth endpoints)
     * - /api/health (public diagnostics)
     * - /_next/* (Next.js internals)
     */
    '/((?!login|auth|api/auth|api/health|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
