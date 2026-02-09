'use client';

import { SWRConfiguration } from 'swr';

/**
 * Cache key registry for SWR
 * Centralizes all cache keys for maintainability and consistency
 */
export const CACHE_KEYS = {
  // User-specific key generators
  userStats: (userId: string) => ['user-stats', userId] as const,
  restaurantsWithVisits: (userId: string) => ['restaurants', userId] as const,
} as const;

/**
 * Global SWR configuration
 * Applies to all useSWR hooks in the application
 */
export const swrConfig: SWRConfiguration = {
  // Refresh data when tab regains focus
  revalidateOnFocus: true,
  // Refresh data when network reconnects (US3: graceful network handling)
  revalidateOnReconnect: true,
  // Dedupe requests within 5 seconds (FR-008: deduplicate concurrent requests)
  dedupingInterval: 5000,
  // Retry failed requests 3 times (FR-005: automatic retry)
  errorRetryCount: 3,
  // Start with 1s delay, exponential backoff
  errorRetryInterval: 1000,
  // Keep showing stale data while revalidating (FR-003: show cached immediately)
  keepPreviousData: true,
};
