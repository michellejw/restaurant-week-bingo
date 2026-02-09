/**
 * Rate Limiter
 *
 * Simple in-memory rate limiter for API endpoints.
 * Note: Resets when Vercel function cold starts, but sufficient for this use case.
 */

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // 10 requests per minute per user
const MAX_ENTRIES = 1000; // Max entries before cleanup

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const requests = new Map<string, RateLimitRecord>();

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
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();

  // Cleanup stale entries if map is too large
  if (requests.size > MAX_ENTRIES) {
    cleanupStaleEntries(now);
  }

  const record = requests.get(identifier);

  // No existing record or window expired - start fresh
  if (!record || now > record.resetAt) {
    requests.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetIn: WINDOW_MS
    };
  }

  // Within window, check if limit exceeded
  if (record.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetAt - now
    };
  }

  // Increment and allow
  record.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.count,
    resetIn: record.resetAt - now
  };
}

/**
 * Remove expired entries from the map to prevent memory leaks.
 */
function cleanupStaleEntries(now: number): void {
  for (const [key, value] of requests) {
    if (now > value.resetAt) {
      requests.delete(key);
    }
  }
}
