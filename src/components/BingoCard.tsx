'use client';

import React, { useState } from 'react';

interface Restaurant {
  id: number;
  name: string;
  visited: boolean;
}

const sampleRestaurants: Restaurant[] = [
  { id: 1, name: "Michael's Seafood", visited: false },
  { id: 2, name: 'Malama Cafe', visited: false },
  { id: 3, name: 'Soul Flavor', visited: false },
  { id: 4, name: "Vinny's Pizza", visited: false },
  { id: 5, name: "Flaming Amy's", visited: false },
  { id: 6, name: "Nollie's Tacos", visited: false },
];

const BingoCard: React.FC = () => {
  const [restaurants, setRestaurants] = useState(sampleRestaurants);

  const handleSquareClick = (id: number) => {
    setRestaurants(prev =>
      prev.map(restaurant =>
        restaurant.id === id ? { ...restaurant, visited: !restaurant.visited } : restaurant
      )
    );
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-4 md:grid-cols-4 lg:grid-cols-5">
      {restaurants.map(restaurant => (
        <button
          key={restaurant.id}
          className={`p-4 border rounded-lg text-center font-medium 
            ${
              restaurant.visited
                ? 'bg-pink-500 text-white border-pink-700'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          onClick={() => handleSquareClick(restaurant.id)}
        >
          {restaurant.name}
        </button>
      ))}
    </div>
  );
};

export default BingoCard;
