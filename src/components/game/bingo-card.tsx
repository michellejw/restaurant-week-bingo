'use client';

import { Restaurant } from '@/types/restaurant';
import { useState } from 'react';

interface BingoCardProps {
  restaurants: Restaurant[];
}

export const BingoCard = ({ restaurants }: BingoCardProps) => {
  const [visitedSquares, setVisitedSquares] = useState<Set<string>>(new Set());

  // Calculate grid size based on number of restaurants
  const gridSize = Math.ceil(Math.sqrt(restaurants.length));

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="aspect-square w-full">
        <div 
          className="grid gap-2 h-full"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className={`
                flex items-center justify-center p-2 text-center
                border-2 rounded-lg shadow-sm transition-all duration-200
                hover:shadow-md cursor-pointer
                ${visitedSquares.has(restaurant.id) 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-white border-gray-200 hover:border-blue-400'}
              `}
              onClick={() => {
                const newVisited = new Set(visitedSquares);
                if (visitedSquares.has(restaurant.id)) {
                  newVisited.delete(restaurant.id);
                } else {
                  newVisited.add(restaurant.id);
                }
                setVisitedSquares(newVisited);
              }}
            >
              <span className="text-sm sm:text-base font-medium">
                {restaurant.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 