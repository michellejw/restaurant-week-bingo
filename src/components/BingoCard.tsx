'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface Restaurant {
  id: string;
  name: string;
  code: string;
  visited: boolean;
}

interface BingoCardProps {
  onVisitUpdate?: () => void;
}

export default function BingoCard({ onVisitUpdate }: BingoCardProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded: clerkLoaded } = useUser();
  const { supabaseId, loading: supabaseLoading } = useSupabaseUser();

  const loadVisits = useCallback(async () => {
    if (!supabaseId) return;

    try {
      // Get all restaurants
      const allRestaurants = await DatabaseService.restaurants.getAll();
      
      // Get user's visits
      const visits = await DatabaseService.visits.getByUser(supabaseId);
      const visitedRestaurantIds = new Set(visits.map(v => v.restaurant_id));

      // Mark restaurants as visited
      const restaurantsWithVisits = allRestaurants.map(restaurant => ({
        ...restaurant,
        visited: visitedRestaurantIds.has(restaurant.id)
      }));

      setRestaurants(restaurantsWithVisits);
      setError(null);
    } catch (err) {
      console.error('Error loading visits:', err);
      setError('Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [supabaseId]);

  useEffect(() => {
    if (clerkLoaded && !supabaseLoading) {
      loadVisits();
    }
  }, [clerkLoaded, supabaseLoading, loadVisits]);

  if (loading || !clerkLoaded || supabaseLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Calculate grid dimensions
  const gridSize = Math.ceil(Math.sqrt(restaurants.length));
  const totalCells = gridSize * gridSize;
  const emptyCells = totalCells - restaurants.length;

  return (
    <div 
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
      }}
    >
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className={`aspect-square p-4 rounded-lg border-2 flex items-center justify-center text-center ${
            restaurant.visited
              ? 'bg-coral-100 border-coral-500 text-coral-700'
              : 'bg-white border-gray-200 text-gray-700'
          }`}
        >
          <span className="text-sm font-medium">{restaurant.name}</span>
        </div>
      ))}
      {/* Add empty cells to complete the grid */}
      {Array.from({ length: emptyCells }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="aspect-square p-4 rounded-lg border-2 border-gray-100 bg-gray-50"
        />
      ))}
    </div>
  );
} 