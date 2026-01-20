/**
 * Check-In API Route
 *
 * POST /api/check-in
 *
 * Handles restaurant check-ins with:
 * - Authentication (Clerk)
 * - Rate limiting
 * - Input validation
 * - Duplicate detection
 * - Visit creation
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

// Initialize Supabase client with service role for writes
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: NextRequest) {
  try {
    // T005: Auth check
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Please sign in to check in' },
        { status: 401 }
      );
    }

    // T006: Rate limiting
    const { allowed, resetIn } = checkRateLimit(userId);

    if (!allowed) {
      const seconds = Math.ceil(resetIn / 1000);
      return NextResponse.json(
        {
          error: `Too many attempts. Please wait ${seconds} seconds.`,
          retryAfter: seconds
        },
        { status: 429 }
      );
    }

    // T007: Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const code = body.code?.trim()?.toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: 'Please enter a restaurant code' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // T008: Look up restaurant by code (case-insensitive)
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, code')
      .ilike('code', code)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Invalid code. Please check and try again.' },
        { status: 404 }
      );
    }

    // T009: Check for existing visit
    const { count: existingCount } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('restaurant_id', restaurant.id);

    if (existingCount && existingCount > 0) {
      return NextResponse.json(
        {
          error: `You've already checked in at ${restaurant.name}!`,
          restaurant: restaurant.name,
          alreadyVisited: true
        },
        { status: 409 }
      );
    }

    // T010: Create visit record
    const { error: visitError } = await supabase
      .from('visits')
      .insert({
        user_id: userId,
        restaurant_id: restaurant.id,
        created_at: new Date().toISOString()
      });

    if (visitError) {
      console.error('Visit creation error:', visitError);
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
    }

    // T011: Fetch updated user stats (trigger should have updated these)
    const { data: stats } = await supabase
      .from('user_stats')
      .select('visit_count, raffle_entries')
      .eq('user_id', userId)
      .single();

    // T012: Return success response
    return NextResponse.json({
      success: true,
      restaurant: restaurant.name,
      stats: {
        visitCount: stats?.visit_count ?? 1,
        raffleEntries: stats?.raffle_entries ?? 0
      }
    });

  } catch (error) {
    // T013: Error handling for database failures
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
