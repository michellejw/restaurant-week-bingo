'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DatabaseService } from '@/lib/services/database';

interface Restaurant {
  id: string;
  name: string;
  code: string;
  visited: boolean;
}

export default function BingoCard() {
  const { user, isLoading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      if (!user) {
        setRestaurants([]);
        return;
      }

      // Get all restaurants
      const restaurantsData = await DatabaseService.restaurants.getAll();
      
      // Get user's visits
      const visits = await DatabaseService.visits.getByUser(user.id);
      const visitedRestaurantIds = new Set(visits.map(v => v.restaurant_id));

      // Process restaurants with visit status
      const processedRestaurants = restaurantsData.map(restaurant => ({
        ...restaurant,
        visited: visitedRestaurantIds.has(restaurant.id)
      }));
      
      setRestaurants(processedRestaurants);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchRestaurants();
    }
  }, [fetchRestaurants, authLoading]);

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Loading bingo card...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const gridCols = Math.ceil(Math.sqrt(restaurants.length));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className={`aspect-square p-2 sm:p-4 border rounded-lg flex items-center justify-center text-center transition-colors duration-200
            ${restaurant.visited 
              ? 'bg-coral-500 text-white border-coral-600' 
              : 'bg-white hover:bg-coral-50 border-gray-100'
            }`}
        >
          <span className="text-xs sm:text-sm font-medium leading-tight">{restaurant.name}</span>
        </div>
      ))}
    </div>
  );
} 