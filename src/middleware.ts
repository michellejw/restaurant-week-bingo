import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add timestamp to make it very clear when this runs
console.log('🎯 Middleware file loaded at:', new Date().toISOString());

// Export config first to make sure it's properly defined
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|favicon.ico).*)'
  ]
};

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Starting middleware for path:', request.nextUrl.pathname);
  
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get the base URL for redirects
  const baseUrl = request.nextUrl.origin;

  // Public paths that don't require auth
  const isPublicPath = request.nextUrl.pathname === '/' || 
                      request.nextUrl.pathname.startsWith('/verify-email') ||
                      request.nextUrl.pathname === '/welcome' ||
                      request.nextUrl.pathname === '/how-to-play' ||
                      request.nextUrl.pathname === '/sponsors' ||
                      request.nextUrl.pathname === '/contact';

  console.log('🔍 Request details:', {
    path: request.nextUrl.pathname,
    isPublic: isPublicPath,
    hasSession: !!session,
    isSettingsPage: request.nextUrl.pathname === '/settings',
    method: request.method,
    timestamp: new Date().toISOString()
  });

  // If trying to access a protected route without a session, redirect to home
  if (!session && !isPublicPath) {
    console.log('🚫 Protected route access denied:', {
      path: request.nextUrl.pathname,
      reason: 'No session',
      redirectingTo: baseUrl
    });
    return NextResponse.redirect(baseUrl);
  }

  // If user is authenticated
  if (session?.user) {
    console.log('👤 Authenticated user accessing:', {
      path: request.nextUrl.pathname,
      email: session.user.email,
      emailConfirmed: !!session.user.email_confirmed_at
    });

    try {
      // Check if user exists in our users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('name, phone, email')
        .eq('id', session.user.id)
        .maybeSingle();

      console.log('📋 User data check:', {
        path: request.nextUrl.pathname,
        hasUserData: !!userData,
        hasError: !!error,
        errorMessage: error?.message
      });

      // Handle settings page access
      if (request.nextUrl.pathname === '/settings') {
        if (!session.user.email_confirmed_at) {
          console.log('📧 Settings access denied - email not confirmed');
          return NextResponse.redirect(`${baseUrl}/verify-email`);
        }
        console.log('✅ Allowing settings page access');
        return res;
      }

      // Email verification check
      if (!session.user.email_confirmed_at && !request.nextUrl.pathname.startsWith('/verify-email')) {
        console.log('📧 Redirecting to verify email');
        return NextResponse.redirect(`${baseUrl}/verify-email`);
      }

      // Welcome page redirect for incomplete profiles
      if (session.user.email_confirmed_at && 
          (!userData || !userData.name || !userData.phone) && 
          !request.nextUrl.pathname.startsWith('/welcome')) {
        console.log('👋 Redirecting to welcome - incomplete profile');
        await supabase
          .from('users')
          .upsert({ 
            id: session.user.id,
            email: session.user.email
          });
        return NextResponse.redirect(`${baseUrl}/welcome`);
      }

    } catch (error) {
      console.error('❌ Middleware error:', error);
      return res;
    }
  }

  const duration = Date.now() - startTime;
  console.log('✨ Middleware complete:', {
    path: request.nextUrl.pathname,
    duration: `${duration}ms`,
    result: 'allowing request'
  });
  
  return res;
} 