import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
      
      // If this is a password reset, redirect to reset page
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', requestUrl.origin));
      }

      // Check if user needs to complete their profile
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', session.user.id)
          .single();

        // If user doesn't exist or is missing required info, redirect to welcome
        if (!userData || !userData.name || !userData.phone) {
          // Ensure user record exists
          await supabase
            .from('users')
            .upsert({ 
              id: session.user.id,
              email: session.user.email
            });
          
          return NextResponse.redirect(new URL('/welcome', requestUrl.origin));
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/?error=auth', requestUrl.origin));
    }
  }

  // For other auth flows, redirect to home
  return NextResponse.redirect(new URL(next, requestUrl.origin));
} 