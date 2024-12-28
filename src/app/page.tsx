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

const sampleRestaurants: Restaurant[] = [
  { id: 1, name: "Michael's Seafood", visited: false, coordinates: [-77.9006, 34.0494] },
  { id: 2, name: 'Malama Cafe', visited: false, coordinates: [-77.9078, 34.0362] }, // Coordinates added
  { id: 3, name: 'Soul Flavor', visited: false, coordinates: [-77.9094, 34.0355] }, // Coordinates added
  { id: 4, name: "Vinny's Pizza", visited: false, coordinates: [-77.9101, 34.0359] }, // Coordinates added
  { id: 5, name: "Flaming Amy's", visited: false, coordinates: [-77.9123, 34.0378] }, // Coordinates added
  { id: 6, name: "Nollie's Tacos", visited: false, coordinates: [-77.9137, 34.0385] }, // Coordinates added
];

const MainPage: React.FC = () => {
  // Add state for restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>(sampleRestaurants);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    // Initialize map instance only once
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

      marker.getElement().addEventListener('click', () => {
        handleMapMarkerClick(restaurant.id);
      });

      markersRef.current.push(marker);
    });
  }, [restaurants]);

  // Handle marker click
  const handleMapMarkerClick = (id: number) => {
    setRestaurants(prev =>
      prev.map(restaurant =>
        restaurant.id === id
          ? {
              ...restaurant,
              visited: true,
            }
          : restaurant
      )
    );
  };

  // Handle bingo square click from the child component
  const handleBingoSquareClick = (id: number) => {
    setRestaurants(prev =>
      prev.map(restaurant =>
        restaurant.id === id
          ? {
              ...restaurant,
              visited: !restaurant.visited,
            }
          : restaurant
      )
    );
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
