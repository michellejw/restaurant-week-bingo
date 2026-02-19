import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ isAdmin: false });
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({ isAdmin: Boolean(data.is_admin) });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
