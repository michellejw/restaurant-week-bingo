/**
 * Rate Limiter Contract
 * Branch: 002-checkin-api
 * Date: 2026-01-20
 *
 * Defines the interface for the rate limiting utility.
 */

// ============================================
// CONFIGURATION
// ============================================

export const RATE_LIMIT_CONFIG = {
  /** Time window in milliseconds */
  WINDOW_MS: 60 * 1000, // 1 minute

  /** Maximum requests allowed per window per user */
  MAX_REQUESTS: 10,

  /** Maximum entries to store before cleanup */
  MAX_ENTRIES: 1000,
} as const;

// ============================================
// INTERFACE
// ============================================

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Number of requests remaining in this window */
  remaining: number;

  /** Milliseconds until the window resets */
  resetIn: number;
}

/**
 * Check if a user has exceeded their rate limit.
 *
 * @param identifier - Unique identifier for the user (e.g., Clerk userId)
 * @returns RateLimitResult indicating if the request is allowed
 *
 * @example
 * const { allowed, resetIn } = checkRateLimit(userId);
 * if (!allowed) {
 *   return Response.json(
 *     { error: `Too many attempts. Please wait ${Math.ceil(resetIn / 1000)} seconds.` },
 *     { status: 429 }
 *   );
 * }
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  // Implementation in src/lib/rate-limit.ts
  throw new Error('Contract only - see implementation file');
}
