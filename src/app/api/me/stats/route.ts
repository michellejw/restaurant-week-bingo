import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: existingStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('visit_count, raffle_entries')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }

    if (existingStats) {
      return NextResponse.json(existingStats);
    }

    const { data: createdStats, error: createError } = await supabase
      .from('user_stats')
      .insert([
        {
          user_id: userId,
          visit_count: 0,
          raffle_entries: 0,
        },
      ])
      .select('visit_count, raffle_entries')
      .single();

    if (createError && createError.code !== '23505') {
      return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }

    if (createdStats) {
      return NextResponse.json(createdStats);
    }

    const { data: retryStats, error: retryError } = await supabase
      .from('user_stats')
      .select('visit_count, raffle_entries')
      .eq('user_id', userId)
      .single();

    if (retryError) {
      return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }

    return NextResponse.json(retryStats);
  } catch {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
