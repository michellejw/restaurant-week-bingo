import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-check';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';

export async function GET() {
  const { authorized } = await verifyAdmin();

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const [restaurantsResult, visitsResult, usersCountResult] = await Promise.all([
      supabase.from('restaurants').select('id, name'),
      supabase
        .from('visits')
        .select('user_id, restaurant_id, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);

    if (restaurantsResult.error || visitsResult.error || usersCountResult.error) {
      return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }

    return NextResponse.json({
      restaurants: restaurantsResult.data ?? [],
      visits: visitsResult.data ?? [],
      totalRegisteredUsers: usersCountResult.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
