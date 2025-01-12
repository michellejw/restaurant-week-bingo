import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withMiddlewareAuthRequired(async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  // Check if trying to access admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // If no session or user is not an admin, redirect to home
    if (!session?.user || session.user.isAdmin !== true) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
});

export const config = {
  matcher: ['/admin/:path*', '/protected/:path*'],
}; 