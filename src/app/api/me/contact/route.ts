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

    const { data, error } = await supabase
      .from('users')
      .select('name, phone')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Failed to load contact info' }, { status: 500 });
    }

    return NextResponse.json({
      name: data?.name ?? null,
      phone: data?.phone ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load contact info' }, { status: 500 });
  }
}
