'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';

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
  const { user, isLoaded } = useUser();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurants() {
      if (!user?.id) return;

      try {
        // Get all restaurants
        const allRestaurants = await DatabaseService.restaurants.getAll();
        
        // Get user's visits
        const visits = await DatabaseService.visits.getByUser(user.id);
        const visitedIds = new Set(visits.map(v => v.restaurant_id));

        // Combine the data
        const restaurantsWithVisits = allRestaurants.map(r => ({
          ...r,
          visited: visitedIds.has(r.id)
        }));

        setRestaurants(restaurantsWithVisits);
      } catch (error) {
        console.error('Error loading restaurants:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      loadRestaurants();
    }
  }, [user?.id, isLoaded, onVisitUpdate]);

  if (loading || !isLoaded) {
    return <div>Loading...</div>;
  }

  // Create a 5x5 grid from the restaurants
  const grid = Array(5).fill(null).map((_, i) => 
    restaurants.slice(i * 5, (i + 1) * 5)
  );

  return (
    <div className="grid grid-cols-5 gap-2 bg-white p-4 rounded-lg border border-gray-200">
      {grid.map((row, i) => (
        row.map((restaurant, j) => (
          <div
            key={`${i}-${j}`}
            className={`aspect-square p-2 flex items-center justify-center text-center border ${
              restaurant?.visited
                ? 'bg-coral-100 border-coral-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="text-sm">
              {restaurant?.name || 'Coming Soon'}
            </span>
          </div>
        ))
      ))}
    </div>
  );
} 