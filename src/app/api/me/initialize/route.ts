import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let email: string | null = null;
    try {
      const body = await request.json();
      email = typeof body?.email === 'string' ? body.email : null;
    } catch {
      email = null;
    }

    const supabase = getSupabaseAdminClient();

    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (existingUserError) {
      return NextResponse.json({ error: 'Failed to initialize user' }, { status: 500 });
    }

    if (existingUser) {
      if (!existingUser.email && email) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ email })
          .eq('id', userId);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to initialize user' }, { status: 500 });
        }
      }
    } else {
      const { error: createUserError } = await supabase
        .from('users')
        .insert([{ id: userId, email }]);

      if (createUserError && createUserError.code !== '23505') {
        return NextResponse.json({ error: 'Failed to initialize user' }, { status: 500 });
      }
    }

    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError) {
      return NextResponse.json({ error: 'Failed to initialize user' }, { status: 500 });
    }

    if (!stats) {
      const { error: createStatsError } = await supabase
        .from('user_stats')
        .insert([
          {
            user_id: userId,
            visit_count: 0,
            raffle_entries: 0,
          },
        ]);

      if (createStatsError && createStatsError.code !== '23505') {
        return NextResponse.json({ error: 'Failed to initialize user' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to initialize user' }, { status: 500 });
  }
}
