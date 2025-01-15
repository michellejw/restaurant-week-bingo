'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabase';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const createIcon = (color: string) => L.icon({
  iconUrl: `/marker-icon-${color}.png`,
  iconRetinaUrl: `/marker-icon-2x-${color}.png`,
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const visitedIcon = createIcon('green');
const unvisitedIcon = createIcon('blue');

interface Restaurant {
  id: string;
  name: string;
  address: string;
  url: string;
  latitude: number;
  longitude: number;
  visited: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

export default function RestaurantMap() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data: restaurantsData, error } = await supabase
        .from('restaurants')
        .select('*');

      if (error) throw error;

      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data: visitsData } = await supabase
        .from('visits')
        .select('restaurant_id')
        .eq('user_id', user.data.user.id);

      const visitedRestaurantIds = new Set(visitsData?.map(v => v.restaurant_id));

      const processedRestaurants = restaurantsData.map(restaurant => ({
        ...restaurant,
        visited: visitedRestaurantIds.has(restaurant.id)
      }));

      setRestaurants(processedRestaurants);

      // Calculate center point
      if (processedRestaurants.length > 0) {
        const avgLat = processedRestaurants.reduce((sum, r) => sum + r.latitude, 0) / processedRestaurants.length;
        const avgLng = processedRestaurants.reduce((sum, r) => sum + r.longitude, 0) / processedRestaurants.length;
        setCenter([avgLat, avgLng]);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  if (!center[0] && !center[1]) {
    return <div>Loading map...</div>;
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={mapContainerStyle}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={[restaurant.latitude, restaurant.longitude]}
          icon={restaurant.visited ? visitedIcon : unvisitedIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold">{restaurant.name}</h3>
              <p className="text-sm">{restaurant.address}</p>
              <a
                href={restaurant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Visit Website
              </a>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  restaurant.visited 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {restaurant.visited ? 'Visited' : 'Not visited'}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 