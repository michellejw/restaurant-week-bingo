'use client';

import { RestaurantMap } from '@/components/map/restaurant-map';
import { BingoCard } from '@/components/game/bingo-card';
import { useEffect, useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { getAllRestaurants } from '@/utils/restaurants';

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getAllRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Week Bingo</h2>
        <RestaurantMap />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Bingo Card</h2>
        {loading ? (
          <p className="text-gray-600">Loading restaurants...</p>
        ) : restaurants.length > 0 ? (
          <BingoCard restaurants={restaurants} />
        ) : (
          <p className="text-gray-600">No restaurants available.</p>
        )}
      </div>
    </div>
  );
}
