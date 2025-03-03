import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    // Check if this is a password reset request
    const requestUrl = new URL(request.url);
    const type = requestUrl.searchParams.get('type');
    const code = requestUrl.searchParams.get('code');

    // If this is a password reset request, redirect to the reset password page
    if (type === 'recovery' && code) {
      const redirectUrl = new URL('/reset-password', request.url);
      redirectUrl.searchParams.set('code', code);
      return NextResponse.redirect(redirectUrl);
    }

    // For all other requests, refresh the session if needed
    await supabase.auth.getSession();
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 