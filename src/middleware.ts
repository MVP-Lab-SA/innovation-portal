export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login (auth page)
     * - /api/auth/* (NextAuth endpoints)
     * - /api/health (public diagnostics)
     * - /_next/* (Next.js internals)
     */
    '/((?!login|api/auth|api/health|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
