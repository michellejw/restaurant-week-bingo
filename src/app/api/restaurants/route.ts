import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface Visit {
  restaurant_id: string;
}

export async function GET() {
  try {
    // Use the anon key for public data access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get restaurants and sponsors (these are public)
    const [restaurantsResult, sponsorsResult] = await Promise.all([
      supabase.from('restaurants').select('*'),
      supabase.from('sponsors').select('*').order('name')
    ]);

    if (restaurantsResult.error) {
      console.error('Restaurant error:', restaurantsResult.error);
      return NextResponse.json({ error: restaurantsResult.error.message }, { status: 500 });
    }

    if (sponsorsResult.error) {
      console.error('Sponsor error:', sponsorsResult.error);
      return NextResponse.json({ error: sponsorsResult.error.message }, { status: 500 });
    }

    // Get user visits if user is authenticated
    const { userId } = await auth();
    let visits: Visit[] = [];
    
    if (userId) {
      // Use service role key for accessing user data
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: userVisits, error: visitsError } = await adminSupabase
        .from('visits')
        .select('restaurant_id')
        .eq('user_id', userId);

      if (visitsError) {
        console.error('Visits error:', visitsError);
      } else {
        visits = userVisits || [];
      }
    }

    // Mark restaurants as visited based on user's visits
    const visitedRestaurantIds = new Set(visits.map(v => v.restaurant_id));
    const restaurants = restaurantsResult.data?.map(restaurant => ({
      ...restaurant,
      visited: visitedRestaurantIds.has(restaurant.id)
    })) || [];

    return NextResponse.json({
      restaurants,
      sponsors: sponsorsResult.data || []
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 