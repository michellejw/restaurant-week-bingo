'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Restaurant } from '@/types/restaurant';
import { getAllRestaurants } from '@/utils/restaurants';

// Center of Carolina Beach area
const INITIAL_VIEW_STATE = {
  latitude: 34.0425,
  longitude: -77.9053,
  zoom: 14
};

export function RestaurantMap() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await getAllRestaurants();
        console.log('Loaded restaurants:', data);
        setRestaurants(data);
      } catch (error) {
        console.error('Error loading restaurants:', error);
      }
    };

    loadRestaurants();
  }, []);

  console.log('Current restaurants state:', restaurants);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {restaurants?.map((restaurant) => (
          <Marker
            key={restaurant.id}
            latitude={restaurant.latitude}
            longitude={restaurant.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedRestaurant(restaurant);
            }}
          >
            <div className="cursor-pointer text-red-500 hover:text-red-700 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
              >
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
          </Marker>
        ))}

        {selectedRestaurant && (
          <Popup
            latitude={selectedRestaurant.latitude}
            longitude={selectedRestaurant.longitude}
            onClose={() => setSelectedRestaurant(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
          >
            <div className="p-2">
              <h3 className="font-bold text-lg">{selectedRestaurant.name}</h3>
              <p className="text-sm text-gray-600">{selectedRestaurant.address}</p>
              <a
                href={selectedRestaurant.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-700 mt-2 block"
              >
                Visit Website
              </a>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
} 