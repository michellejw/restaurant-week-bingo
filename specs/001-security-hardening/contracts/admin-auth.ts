/**
 * Admin Authentication Contract
 * Branch: 001-security-hardening
 * Date: 2026-01-16
 *
 * This contract defines the interface for the admin verification helper.
 * Implementation goes in src/lib/auth/admin-check.ts
 */

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
 * This function MUST:
 * 1. Check auth provider (Clerk) for valid session
 * 2. If no session, return { authorized: false, userId: null }
 * 3. Query database for user's is_admin flag
 * 4. Return { authorized: true, userId } only if both checks pass
 * 5. On ANY error (Clerk unavailable, database timeout, etc.), return { authorized: false, userId: null, error: <message> }
 *
 * This function MUST NOT:
 * - Throw exceptions (return unauthorized result instead)
 * - Fail open (errors MUST result in denial, not access)
 * - Cache results (always verify fresh)
 * - Log sensitive information
 *
 * @returns Promise<AdminVerificationResult>
 *
 * @example
 * // In a Server Component
 * const { authorized, userId } = await verifyAdmin();
 * if (!authorized) {
 *   redirect('/');
 * }
 * // User is authenticated and is admin, proceed with rendering
 */
export async function verifyAdmin(): Promise<AdminVerificationResult> {
  // Implementation in src/lib/auth/admin-check.ts
  throw new Error('Contract only - see implementation file');
}

/**
 * Usage pattern for admin pages:
 *
 * ```typescript
 * // src/app/admin/page.tsx (Server Component)
 * import { verifyAdmin } from '@/lib/auth/admin-check';
 * import { redirect } from 'next/navigation';
 * import AdminContent from './AdminContent';
 *
 * export default async function AdminPage() {
 *   const { authorized } = await verifyAdmin();
 *
 *   if (!authorized) {
 *     redirect('/');
 *   }
 *
 *   return <AdminContent />;
 * }
 * ```
 *
 * ```typescript
 * // src/app/admin/AdminContent.tsx (Client Component)
 * "use client";
 *
 * export default function AdminContent() {
 *   // All the interactive admin UI here
 *   // Safe because Server Component already verified auth
 * }
 * ```
 */