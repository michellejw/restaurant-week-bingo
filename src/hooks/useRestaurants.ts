'use client';

import useSWR, { mutate } from 'swr';
import { useUser } from '@clerk/nextjs';
import { CACHE_KEYS } from '@/lib/swr/config';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  category: string;
  code: string;
  latitude: number;
  longitude: number;
  logo_url: string | null;
  created_at: string;
  visited: boolean;
}

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
}

interface RestaurantsResponse {
  restaurants: Restaurant[];
  sponsors: Sponsor[];
}

async function fetchRestaurants(): Promise<RestaurantsResponse> {
  const response = await fetch('/api/restaurants', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch restaurants');
  }
  return response.json();
}

export function useRestaurants() {
  const { user, isLoaded: clerkLoaded } = useUser();

  // Use user-specific cache key when logged in
  const cacheKey = clerkLoaded && user?.id
    ? CACHE_KEYS.restaurantsWithVisits(user.id)
    : null;

  const { data, error, isLoading, isValidating } = useSWR<RestaurantsResponse>(
    cacheKey,
    fetchRestaurants
  );

  return {
    restaurants: data?.restaurants ?? [],
    sponsors: data?.sponsors ?? [],
    isLoading: !clerkLoaded || isLoading,
    isValidating,
    error,
    // Expose mutate for cache invalidation after check-in
    refresh: () => {
      if (user?.id) {
        return mutate(CACHE_KEYS.restaurantsWithVisits(user.id));
      }
    },
  };
}
