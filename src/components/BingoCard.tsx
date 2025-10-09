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
  onRestaurantSelect?: (restaurantId: string) => void;
  selectedRestaurantId?: string | null;
}

export default function BingoCard({ onVisitUpdate, onRestaurantSelect, selectedRestaurantId }: BingoCardProps) {
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

  return (
    <div className="grid grid-cols-3 lg:grid-cols-5 gap-[1px] bg-white rounded border-[0.5px] border-gray-100">
      {restaurants.map((restaurant) => {
        const isSelected = selectedRestaurantId === restaurant.id;
        const handleClick = () => {
          if (isSelected) {
            // Toggle off - deselect current restaurant
            onRestaurantSelect?.('');
          } else {
            // Select this restaurant
            onRestaurantSelect?.(restaurant.id);
          }
        };
        
        return (
          <button
            key={restaurant.id}
            onClick={handleClick}
            className={`aspect-square flex items-center justify-center text-center border-[0.5px] transition-all duration-200 hover:scale-105 hover:shadow-md hover:z-10 relative ${
              isSelected
                ? 'bg-red-100 border-red-300 hover:bg-red-200 ring-2 ring-red-400'
                : restaurant.visited
                  ? 'bg-coral-100 border-coral-200 hover:bg-coral-200'
                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
            }`}
            title={isSelected ? `Click to deselect ${restaurant.name}` : `Click to view ${restaurant.name} on map`}
          >
            <span className={`text-xs leading-tight px-0.5 pointer-events-none ${
              isSelected ? 'font-semibold text-red-800' : ''
            }`}>
              {restaurant.name}
            </span>
          </button>
        );
      })}    
    </div>
  );
} 