export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login (auth page)
     * - /api/auth/* (NextAuth endpoints)
     * - /_next/* (Next.js internals)
     * - /favicon, /robots, etc.
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
