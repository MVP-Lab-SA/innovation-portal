import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const neonMiddleware = auth.middleware({ loginUrl: '/login' });

export default async function middleware(req: NextRequest) {
  const res = await (neonMiddleware as (r: NextRequest) => Promise<NextResponse>)(req);

  // Append ?next= so the login page can redirect back after auth
  const location = res.headers.get('location');
  if (location && (res.status === 302 || res.status === 307 || res.status === 308)) {
    const dest = new URL(location, req.url);
    if (dest.pathname === '/login' && !dest.searchParams.has('next')) {
      const next = req.nextUrl.pathname + req.nextUrl.search;
      if (next && next !== '/login') {
        dest.searchParams.set('next', next);
        return NextResponse.redirect(dest, res.status);
      }
    }
  }

  return res;
}

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
