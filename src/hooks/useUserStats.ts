'use client';

import useSWR, { mutate } from 'swr';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import { CACHE_KEYS } from '@/lib/swr/config';

interface UserStats {
  visit_count: number;
  raffle_entries: number;
}

const DEFAULT_STATS: UserStats = { visit_count: 0, raffle_entries: 0 };

async function fetchUserStats(key: readonly [string, string]): Promise<UserStats> {
  const [, userId] = key;
  const stats = await DatabaseService.userStats.getOrCreate(userId);
  return {
    visit_count: stats.visit_count,
    raffle_entries: stats.raffle_entries,
  };
}

export function useUserStats() {
  const { user, isLoaded: clerkLoaded } = useUser();

  // Use user-specific cache key when logged in
  const cacheKey = clerkLoaded && user?.id
    ? CACHE_KEYS.userStats(user.id)
    : null;

  const { data, error, isLoading, isValidating } = useSWR<UserStats>(
    cacheKey,
    fetchUserStats
  );

  return {
    stats: data ?? DEFAULT_STATS,
    loading: !clerkLoaded || isLoading,
    isValidating,
    error,
    // Expose refresh for cache invalidation after check-in
    // Maintains backward compatibility with existing code
    refresh: async () => {
      if (user?.id) {
        await mutate(CACHE_KEYS.userStats(user.id));
      }
    },
  };
}
