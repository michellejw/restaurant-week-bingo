'use client';
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import BingoCard from '@/components/BingoCard';

interface Restaurant {
  id: number;
  name: string;
  visited: boolean;
  coordinates: [number, number];
}

const MainPage: React.FC = () => {
  // Add state for restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Fetch live data from the API on page load
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('/api/restaurants'); // call the GET API route
        const data = await response.json();
        setRestaurants(data); // Update state with live data
      } catch (error) {
        console.error('Error fetching restaurants', error);
      }
    };
    const loadRestaurants = async () => {
      await fetchRestaurants();
    };

    loadRestaurants().catch(error => console.error('Error in loadRestaurants:', error));
  }, []);

  // Initialize map instance only once
  useEffect(() => {
    if (!mapInstance.current && mapContainer.current) {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-77.9006, 34.0494],
        zoom: 11,
      });
    }
  }, []);

  // Add markers to the map whenever restaurants are updated
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker: mapboxgl.Marker) => marker.remove());
    markersRef.current = []; // Reset markersRef

    // Add markers for current restaurants
    restaurants.forEach(restaurant => {
      const marker = new mapboxgl.Marker({
        color: restaurant.visited ? 'green' : 'red',
      })
        .setLngLat(restaurant.coordinates)
        .setPopup(new mapboxgl.Popup().setText(restaurant.name))
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [restaurants]);

  // Handle bingo square click from the child component
  const handleBingoSquareClick = async (id: number) => {
    try {
      // Find the restaurant to update its visited status
      const restaurant = restaurants.find(r => r.id === id);
      if (!restaurant) return;

      // Update the database via the PUT API route
      const response = await fetch('/api/restaurants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: id, visited: !restaurant.visited }),
      });

      if (response.ok) {
        // Update the UI state after successfully updating the backend
        setRestaurants(prev =>
          prev.map(r =>
            r.id === id
              ? {
                  ...r,
                  visited: !r.visited,
                }
              : r
          )
        );
      } else {
        console.error('Failed to update restaurant in the backend.');
      }
    } catch (error) {
      console.error('Error updating restaurant', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <h1>Restaurant Week Bingo!</h1>
      <div
        style={{
          flex: 1,
          backgroundColor: '#e0e0e0',
          marginBottom: '20px',
          marginLeft: '-10px',
          marginRight: '-10px',
        }}
      >
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>
      </div>
      <div style={{ flex: 1, backgroundColor: '#f0f0f0', margin: '20px' }}>
        <BingoCard restaurants={restaurants} onSquareClick={handleBingoSquareClick} />
      </div>
    </div>
  );
};

export default MainPage;
