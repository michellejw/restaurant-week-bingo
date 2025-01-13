import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createAdminClient } from '@/utils/supabase';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurantId } = await request.json();
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // First, get the restaurant details
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      console.error('Error fetching restaurant:', restaurantError);
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Check if visit already exists
    const { data: existingVisit, error: existingVisitError } = await supabase
      .from('restaurant_visits')
      .select('*')
      .eq('user_id', session.user.sub)
      .eq('restaurant_id', restaurantId)
      .single();

    if (existingVisitError && existingVisitError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error checking existing visit:', existingVisitError);
      return NextResponse.json({ error: 'Failed to check existing visit' }, { status: 500 });
    }

    if (existingVisit) {
      return NextResponse.json({ 
        message: 'Visit already recorded',
        restaurant 
      });
    }

    // Record the visit
    const { error: visitError } = await supabase
      .from('restaurant_visits')
      .insert({
        user_id: session.user.sub,
        restaurant_id: restaurantId,
        visited_at: new Date().toISOString()
      });

    if (visitError) {
      console.error('Error recording visit:', visitError);
      return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Visit recorded successfully',
      restaurant
    });
  } catch (error) {
    console.error('Error recording visit:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 