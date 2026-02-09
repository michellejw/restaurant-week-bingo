/**
 * Check-In API Contract
 * Branch: 002-checkin-api
 * Date: 2026-01-20
 *
 * Defines the request/response types for the check-in API endpoint.
 */

// ============================================
// REQUEST
// ============================================

export interface CheckInRequest {
  /** Restaurant code (case-insensitive) */
  code: string;
}

// ============================================
// RESPONSES
// ============================================

export interface CheckInSuccessResponse {
  success: true;
  /** Name of the restaurant checked into */
  restaurant: string;
  /** Updated user stats after check-in */
  stats: {
    visitCount: number;
    raffleEntries: number;
  };
}

export interface CheckInErrorResponse {
  /** User-friendly error message */
  error: string;
  /** Restaurant name (only present on duplicate visit) */
  restaurant?: string;
  /** Flag indicating this was a duplicate visit attempt */
  alreadyVisited?: boolean;
  /** Seconds until rate limit resets (only present on 429) */
  retryAfter?: number;
}

export type CheckInResponse = CheckInSuccessResponse | CheckInErrorResponse;

// ============================================
// HTTP STATUS CODES
// ============================================

export const CHECK_IN_STATUS = {
  /** Check-in successful */
  SUCCESS: 200,
  /** Missing or empty code */
  BAD_REQUEST: 400,
  /** User not authenticated */
  UNAUTHORIZED: 401,
  /** Restaurant code not found */
  NOT_FOUND: 404,
  /** Already visited this restaurant */
  CONFLICT: 409,
  /** Rate limit exceeded */
  TOO_MANY_REQUESTS: 429,
  /** Server error */
  SERVER_ERROR: 500,
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const CHECK_IN_ERRORS = {
  EMPTY_CODE: 'Please enter a restaurant code',
  UNAUTHORIZED: 'Please sign in to check in',
  INVALID_CODE: 'Invalid code. Please check and try again.',
  ALREADY_VISITED: (restaurant: string) => `You've already checked in at ${restaurant}!`,
  RATE_LIMITED: (seconds: number) => `Too many attempts. Please wait ${seconds} seconds.`,
  SERVER_ERROR: 'Something went wrong. Please try again.',
} as const;
