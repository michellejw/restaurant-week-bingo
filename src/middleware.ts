import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

console.log('🎯 Middleware file loaded');

export async function middleware(request: NextRequest) {
  console.log('🚀 Middleware - Path:', request.nextUrl.pathname);
  
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();
  console.log('👤 Session state:', {
    hasSession: !!session,
    isEmailConfirmed: session?.user?.email_confirmed_at ? true : false,
    email: session?.user?.email,
  });

  // Get the base URL for redirects (maintaining the current protocol and host)
  const baseUrl = request.nextUrl.origin;

  // Public paths that don't require auth
  const isPublicPath = request.nextUrl.pathname === '/' || 
                      request.nextUrl.pathname.startsWith('/verify-email') ||
                      request.nextUrl.pathname === '/welcome';

  // Protected paths that should redirect to welcome if user info is missing
  const shouldCheckUserInfo = !request.nextUrl.pathname.startsWith('/verify-email') &&
                            !request.nextUrl.pathname.startsWith('/welcome') &&
                            request.nextUrl.pathname !== '/';

  // If no session and trying to access protected route, redirect to home
  if (!session && !isPublicPath) {
    console.log('🔒 No session, redirecting to home');
    return NextResponse.redirect(baseUrl);
  }

  // If user is authenticated
  if (session?.user) {
    try {
      // Check if user exists in our users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('name, phone, email')
        .eq('id', session.user.id)
        .maybeSingle();

      console.log('📋 User data state:', {
        hasUserData: !!userData,
        name: userData?.name,
        phone: userData?.phone,
        error: error?.message
      });

      // If email not confirmed and not on verify-email page, redirect to verify
      if (!session.user.email_confirmed_at && !request.nextUrl.pathname.startsWith('/verify-email')) {
        console.log('📧 Email not confirmed, redirecting to verify-email');
        return NextResponse.redirect(`${baseUrl}/verify-email`);
      }

      // If email is confirmed and user info is missing, redirect to welcome
      if (session.user.email_confirmed_at && (!userData || !userData.name || !userData.phone) && shouldCheckUserInfo) {
        console.log('👋 Email confirmed but missing user info, redirecting to welcome');
        // First ensure the user record exists
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({ 
            id: session.user.id,
            email: session.user.email
          });
        
        console.log('➕ Upsert user result:', { error: upsertError?.message });
        return NextResponse.redirect(`${baseUrl}/welcome`);
      }

      // If on verify-email page but email is confirmed, redirect to welcome or home
      if (session.user.email_confirmed_at && request.nextUrl.pathname.startsWith('/verify-email')) {
        if (!userData || !userData.name || !userData.phone) {
          console.log('✉️ Email verified, redirecting to welcome from verify page');
          return NextResponse.redirect(`${baseUrl}/welcome`);
        }
        console.log('✅ All set, redirecting to home from verify page');
        return NextResponse.redirect(baseUrl);
      }

    } catch (error) {
      console.error('❌ Middleware error:', error);
      // On error, allow the request to continue to avoid blocking the user
      return res;
    }
  }

  console.log('✨ Middleware complete - allowing request');
  return res;
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 