'use client';

import { RestaurantMap } from '@/components/map/restaurant-map';
import { BingoCard } from '@/components/game/bingo-card';
import { useEffect, useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { getAllRestaurants } from '@/utils/restaurants';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Home() {
  const { user, isLoading: authLoading } = useUser();
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

    if (user) {
      fetchRestaurants();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Restaurant Week Bingo!
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Join the fun and explore local restaurants during Restaurant Week. 
          Complete your bingo card by visiting restaurants and win exciting prizes!
        </p>
        <a
          href="/api/auth/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Login to Start Playing
        </a>
      </div>
    );
  }

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
