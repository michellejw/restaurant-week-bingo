'use client';

import { RestaurantMap } from '@/components/map/restaurant-map';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Week Bingo</h2>
        <RestaurantMap />
      </div>
      
      {/* Bingo card will go here later */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Bingo Card</h2>
        <p className="text-gray-600">Coming soon...</p>
      </div>
    </div>
  );
}
