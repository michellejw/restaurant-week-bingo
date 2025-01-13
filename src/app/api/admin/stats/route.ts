import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('isAdmin')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total restaurants
    const { count: restaurantCount, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('*', { count: 'exact', head: true });

    if (restaurantError) throw restaurantError;

    // Get total users
    const { count: userCount, error: userCountError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (userCountError) throw userCountError;

    // Get total visits
    const { count: visitCount, error: visitError } = await supabaseAdmin
      .from('visits')
      .select('*', { count: 'exact', head: true });

    if (visitError) throw visitError;

    return NextResponse.json({
      totalRestaurants: restaurantCount || 0,
      totalUsers: userCount || 0,
      totalVisits: visitCount || 0,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 