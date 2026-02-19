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

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
