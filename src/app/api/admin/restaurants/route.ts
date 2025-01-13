import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request: Request) {
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
    
    // Get the restaurant data from the request
    const restaurantData = await request.json();
    console.log('Attempting to insert restaurant:', restaurantData);

    // Insert the restaurant using the admin client
    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single();

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

    console.log('Restaurant created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Detailed error in restaurant creation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 