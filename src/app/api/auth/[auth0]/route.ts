import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import { supabase } from '@/utils/supabase';

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

    // Check if user exists in Supabase
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    console.log('Supabase select result:', { existingUser, selectError });

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', selectError);
      return session;
    }

    if (!existingUser) {
      console.log('Attempting to create new user in Supabase');
      const newUser = {
        email: user.email,
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        isAdmin: false,
      };
      console.log('New user data:', newUser);

      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      console.log('Supabase insert result:', { insertedUser, insertError });

      if (insertError) {
        console.error('Error creating user in Supabase:', insertError);
      }
      
      // Add isAdmin status to session
      session.user.isAdmin = false;
    } else {
      // Add the existing user's admin status to the session
      session.user.isAdmin = existingUser.isAdmin;
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