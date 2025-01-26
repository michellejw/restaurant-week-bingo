'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

// Modern SVG marker icons - moved inside component to ensure client-side only
const createIcon = (fillColor: string) => {
  const svgTemplate = encodeURIComponent(`
    <svg width="24" height="32" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
      </filter>
      <path d="M18 0C8.064 0 0 8.064 0 18c0 8.01 9.42 19.476 14.688 25.416C16.02 45.9 17.064 47.052 18 48c0.936-0.948 1.98-2.1 3.312-4.584C26.58 37.476 36 26.01 36 18c0-9.936-8.064-18-18-18z" 
        fill="${fillColor}" filter="url(#shadow)"/>
    </svg>
  `);

  return L.divIcon({
    html: `<div style="width: 24px; height: 32px;"><img src="data:image/svg+xml,${svgTemplate}" /></div>`,
    className: '',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32]
  });
};

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
  height: '400px',
  zIndex: 0
};

type LatLngBounds = [[number, number], [number, number]];

interface RestaurantMapProps {
  lastCheckIn?: number;
}

export default function RestaurantMap({ lastCheckIn }: RestaurantMapProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [icons, setIcons] = useState<{ visited: L.DivIcon; unvisited: L.DivIcon } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, userId } = useAuth();

  useEffect(() => {
    setIsClient(true);
    setIcons({
      visited: createIcon('#ff5436'),
      unvisited: createIcon('#94a3b8')
    });
  }, []);

  const fetchRestaurants = useCallback(async () => {
    if (!isLoggedIn || !userId) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching restaurants...');
      
      // Fetch visits first
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('restaurant_id')
        .eq('user_id', userId);

      if (visitsError) throw visitsError;
      
      const visitedIds = new Set(visitsData?.map(v => v.restaurant_id));
      console.log('Visited IDs:', Array.from(visitedIds));
      
      // Then fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*');

      if (restaurantsError) throw restaurantsError;

      const processedRestaurants = restaurantsData.map(restaurant => ({
        ...restaurant,
        visited: visitedIds.has(restaurant.id)
      }));

      console.log('Restaurant states:', processedRestaurants.map(r => `${r.name}: ${r.visited}`));
      setRestaurants(processedRestaurants);
      setBounds(calculateBounds(processedRestaurants));
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, userId]);

  // Fetch on mount and when lastCheckIn changes
  useEffect(() => {
    if (isClient) {
      console.log('Fetching due to lastCheckIn update:', lastCheckIn);
      fetchRestaurants();
    }
  }, [fetchRestaurants, isClient, lastCheckIn]);

  useEffect(() => {
    console.log('Restaurants state changed:', 
      restaurants.map(r => ({
        name: r.name,
        visited: r.visited
      }))
    );
  }, [restaurants]);

  const calculateBounds = (locations: Restaurant[]): LatLngBounds | null => {
    if (locations.length === 0) return null;
    
    let minLat = locations[0].latitude;
    let maxLat = locations[0].latitude;
    let minLng = locations[0].longitude;
    let maxLng = locations[0].longitude;

    locations.forEach(location => {
      minLat = Math.min(minLat, location.latitude);
      maxLat = Math.max(maxLat, location.latitude);
      minLng = Math.min(minLng, location.longitude);
      maxLng = Math.max(maxLng, location.longitude);
    });

    const latPadding = (maxLat - minLat) * 0.05;
    const lngPadding = (maxLng - minLng) * 0.05;

    return [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding]
    ];
  };

  if (!isClient || !icons) {
    return <div>Loading map...</div>;
  }

  if (isLoading) {
    return <div>Loading restaurants...</div>;
  }

  if (!isLoggedIn) {
    return <div>Please sign in to view the restaurant map.</div>;
  }

  if (!bounds && restaurants.length > 0) {
    return <div>Error loading map bounds.</div>;
  }

  const center: [number, number] = bounds ? [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2
  ] : [0, 0];

  return (
    <MapContainer
      key={restaurants.map(r => `${r.id}-${r.visited}`).join(',')}
      bounds={bounds || undefined}
      center={center}
      zoom={14}
      minZoom={13}
      maxZoom={18}
      style={mapContainerStyle}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurants.map((restaurant) => (
        <Marker
          key={`${restaurant.id}-${restaurant.visited}`}
          position={[restaurant.latitude, restaurant.longitude]}
          icon={restaurant.visited ? icons.visited : icons.unvisited}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-medium mb-1">{restaurant.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
              {restaurant.url && (
                <a
                  href={restaurant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-coral-600 hover:text-coral-800"
                >
                  Visit Website
                </a>
              )}
              <div className={`mt-2 px-2 py-1 rounded text-sm ${
                restaurant.visited
                ? 'bg-coral-100 text-coral-800'
                : 'bg-gray-100 text-gray-800'
              }`}>
                {restaurant.visited ? 'Visited!' : 'Not visited yet'}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
} 