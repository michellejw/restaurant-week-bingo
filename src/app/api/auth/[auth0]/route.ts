import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

const afterCallback = async (req: Request, session: any) => {
  try {
    console.log('Session received:', session);

    if (!session?.user) {
      console.log('No user in session');
      return session;
    }

    const { user } = session;
    console.log('Auth0 user details:', {
      email: user.email,
      name: user.name,
      sub: user.sub
    });

    // Create admin Supabase client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    try {
      // First try to get the user
      const { data: existingUser, error: selectError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      console.log('Supabase select result:', { existingUser, selectError });

      let userData = existingUser;

      // If user doesn't exist, create them
      if (!existingUser && (!selectError || selectError.code === 'PGRST116')) {
        console.log('Creating new user in Supabase');
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert([{
            email: user.email,
            name: user.name || user.email?.split('@')[0] || 'Anonymous',
            isAdmin: false
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          return session;
        }

        userData = newUser;
        console.log('Created new user:', newUser);
      }

      if (userData) {
        // Set the admin status in the session
        session.user.isAdmin = userData.isAdmin;
        console.log('Set user admin status:', userData.isAdmin);
      }
    } catch (error) {
      console.error('Error managing user in Supabase:', error);
    }

    return session;
  } catch (error) {
    console.error('Error in afterCallback:', error);
    return session;
  }
};

const handler = handleAuth({
  callback: handleCallback({ afterCallback }),
  onError: (req: Request, error: Error) => {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  },
});

export const GET = handler;
export const POST = handler; 