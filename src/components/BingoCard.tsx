'use client';

import React from 'react';

interface Restaurant {
  id: number;
  name: string;
  visited: boolean;
}

interface BingoCardProps {
  restaurants: Restaurant[];
  onSquareClick: (id: number) => void;
}

const BingoCard: React.FC<BingoCardProps> = ({ restaurants, onSquareClick }) => {
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
          onClick={() => onSquareClick(restaurant.id)}
        >
          {restaurant.name}
        </button>
      ))}
    </div>
  );
};

export default BingoCard;
