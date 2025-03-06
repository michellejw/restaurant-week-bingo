import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';

export function useUserStats() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [stats, setStats] = useState({ visit_count: 0, raffle_entries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (!user) {
        setStats({ visit_count: 0, raffle_entries: 0 });
        setLoading(false);
        return;
      }

      try {
        const userStats = await DatabaseService.userStats.getOrCreate(user.id);
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
        const userStats = await DatabaseService.userStats.getOrCreate(user.id);
        setStats(userStats);
      }
    }
  };
} 