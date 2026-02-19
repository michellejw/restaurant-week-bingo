import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-check';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';

interface VisitChange {
  restaurantId: string;
  action: 'add' | 'remove';
}

export async function GET(request: NextRequest) {
  const { authorized } = await verifyAdmin();

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('visits')
      .select('restaurant_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 });
    }

    return NextResponse.json({ visits: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Failed to load visits' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { authorized } = await verifyAdmin();

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { userId?: string; changes?: VisitChange[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const userId = body.userId;
  const changes = body.changes;

  if (!userId || !Array.isArray(changes)) {
    return NextResponse.json({ error: 'Missing userId or changes' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    for (const change of changes) {
      if (!change?.restaurantId || !change?.action) {
        return NextResponse.json({ error: 'Invalid changes payload' }, { status: 400 });
      }

      if (change.action === 'add') {
        const { error } = await supabase
          .from('visits')
          .upsert(
            {
              user_id: userId,
              restaurant_id: change.restaurantId,
              created_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,restaurant_id' }
          );

        if (error) {
          return NextResponse.json({ error: 'Failed to update visits' }, { status: 500 });
        }
      } else if (change.action === 'remove') {
        const { error } = await supabase
          .from('visits')
          .delete()
          .eq('user_id', userId)
          .eq('restaurant_id', change.restaurantId);

        if (error) {
          return NextResponse.json({ error: 'Failed to update visits' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Invalid change action' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update visits' }, { status: 500 });
  }
}
