'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserStats {
  visit_count: number;
  raffle_entries: number;
}

const DEFAULT_STATS: UserStats = { visit_count: 0, raffle_entries: 0 };

async function fetchUserStats(): Promise<UserStats> {
  const response = await fetch('/api/me/stats');
  if (!response.ok) {
    throw new Error('Failed to load user stats');
  }

  const stats = await response.json();
  return {
    visit_count: stats.visit_count,
    raffle_entries: stats.raffle_entries,
  };
}

export function useUserStats() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (!user) {
        setStats(DEFAULT_STATS);
        setLoading(false);
        return;
      }

      try {
        const userStats = await fetchUserStats();
        setStats(userStats);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to load stats'));
      } finally {
        setLoading(false);
      }
    }

    if (clerkLoaded) {
      loadStats();
    }
  }, [user, clerkLoaded]);

  return {
    stats,
    loading: loading || !clerkLoaded,
    error,
    refresh: async () => {
      if (user) {
        const userStats = await fetchUserStats();
        setStats(userStats);
      }
    },
  };
}
