import { NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: Request) {
  const { pathname } = new URL(req.url);

  // Skip public files, API routes, and the landing page itself
  if (pathname.startsWith('/api') || PUBLIC_FILE.test(pathname) || pathname === '/landing') {
    return NextResponse.next();
  }

  // Check if the user is logged in by looking for the Auth0 session cookie
  const authCookie = req.headers.get('cookie')?.includes('appSession');
  const isLoggedIn = !!authCookie;

  if (isLoggedIn) {
    // Allow access
    return NextResponse.next();
  } else {
    // Redirect unauthenticated users to the landing page
    return NextResponse.redirect(new URL('/landing', req.url));
  }
}
