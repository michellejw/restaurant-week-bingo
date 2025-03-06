import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { adminSupabase } from '@/lib/supabase-admin';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = '0da4e8d4-8a5e-4bfa-941c-226c4b9d8ac9';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const primaryEmail = user.emailAddresses[0]?.emailAddress;
    if (!primaryEmail) {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 });
    }

    // Convert Clerk ID to Supabase UUID
    const supabaseId = uuidv5(userId, NAMESPACE);

    // Create or update user
    const { error: userError } = await adminSupabase
      .from('users')
      .upsert({
        id: supabaseId,
        email: primaryEmail,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null,
      });

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Initialize user stats
    const { error: statsError } = await adminSupabase
      .from('user_stats')
      .upsert({
        user_id: supabaseId,
        visit_count: 0,
        raffle_entries: 0,
      });

    if (statsError) {
      console.error('Error initializing stats:', statsError);
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: supabaseId });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 