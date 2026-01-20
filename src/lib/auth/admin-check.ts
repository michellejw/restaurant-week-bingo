/**
 * Admin Authentication Helper
 * Branch: 001-security-hardening
 *
 * Server-side admin verification for Next.js Server Components.
 * This file implements the contract defined in specs/001-security-hardening/contracts/admin-auth.ts
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Result of admin verification check
 */
export interface AdminVerificationResult {
  /** Whether the user is authorized as admin */
  authorized: boolean;

  /** The user's ID from auth provider, or null if not authenticated */
  userId: string | null;

  /** Optional error message for logging (not exposed to user) */
  error?: string;
}

/**
 * Verifies that the current request is from an authenticated admin user.
 *
 * This function:
 * 1. Checks Clerk for valid session
 * 2. If no session, returns { authorized: false, userId: null }
 * 3. Queries database for user's is_admin flag
 * 4. Returns { authorized: true, userId } only if both checks pass
 * 5. On ANY error, returns { authorized: false, userId: null, error: <message> }
 *
 * This function does NOT:
 * - Throw exceptions (returns unauthorized result instead)
 * - Fail open (errors result in denial, not access)
 * - Cache results (always verifies fresh)
 * - Log sensitive information
 *
 * @returns Promise<AdminVerificationResult>
 *
 * @example
 * // In a Server Component
 * const { authorized } = await verifyAdmin();
 * if (!authorized) {
 *   redirect('/');
 * }
 */
export async function verifyAdmin(): Promise<AdminVerificationResult> {
  try {
    // Step 1: Check Clerk session
    const { userId } = await auth();

    if (!userId) {
      return {
        authorized: false,
        userId: null,
      };
    }

    // Step 2: Query database for admin status using service role
    // We use the service role key to bypass RLS for this check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      // Fail closed: missing config means deny access
      return {
        authorized: false,
        userId,
        error: 'Missing database configuration',
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (dbError) {
      // Fail closed: database error means deny access
      return {
        authorized: false,
        userId,
        error: `Database error: ${dbError.message}`,
      };
    }

    if (!user) {
      // User not found in database
      return {
        authorized: false,
        userId,
        error: 'User not found in database',
      };
    }

    // Step 3: Check admin flag
    if (!user.is_admin) {
      return {
        authorized: false,
        userId,
      };
    }

    // All checks passed
    return {
      authorized: true,
      userId,
    };

  } catch (error) {
    // Fail closed: any unexpected error means deny access
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      authorized: false,
      userId: null,
      error: `Verification failed: ${errorMessage}`,
    };
  }
}