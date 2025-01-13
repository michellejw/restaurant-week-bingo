import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase';
import { getSession } from '@auth0/nextjs-auth0';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getSession();
    console.log('Auth session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the admin supabase client
    const supabaseAdmin = createAdminClient();
    console.log('Admin client created successfully');
    
    // Delete the restaurant
    const { error } = await supabaseAdmin
      .from('restaurants')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in restaurant deletion:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 