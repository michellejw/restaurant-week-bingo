'use client';

import { useRestaurants } from '@/hooks/useRestaurants';

interface BingoCardProps {
  onVisitUpdate?: () => void;
  onRestaurantSelect?: (restaurantId: string) => void;
  selectedRestaurantId?: string | null;
}

export default function BingoCard({ onRestaurantSelect, selectedRestaurantId }: BingoCardProps) {
  const { restaurants, isLoading } = useRestaurants();

  if (isLoading) {
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
