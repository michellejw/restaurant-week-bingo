/**
 * Sentry User Context Helper
 *
 * Sets the user context for Sentry error tracking.
 * IMPORTANT: Only sends Clerk user ID - NO PII (email, name, phone, etc.)
 * per FR-005 requirements.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Set or clear the Sentry user context.
 * Call this when auth state changes (sign in, sign out).
 *
 * @param userId - Clerk user ID, or null to clear context
 */
export function setSentryUserContext(userId: string | null): void {
  if (userId) {
    // Only set the user ID - no PII fields
    Sentry.setUser({ id: userId });
  } else {
    // Clear user context on sign out
    Sentry.setUser(null);
  }
}
