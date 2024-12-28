'use client';
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import BingoCard from '@/components/BingoCard';

const MainPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize mapbox
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    const map = mapContainer.current
      ? new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [-77.9006, 34.0494],
          zoom: 11,
        })
      : null;

    // Sample restaurant data
    const restaurants = [
      {
        name: "Michael's seafood",
        coordinates: [-77.9006, 34.0494] as [number, number],
      },
      {
        name: 'Malama Cafe',
        coordinates: [-77.9106, 34.0594] as [number, number],
      },
      {
        name: 'Soul Flavor',
        coordinates: [-77.9206, 34.0394] as [number, number],
      },
    ];

    // Add markers to map
    if (map) {
      restaurants.forEach(restaurant => {
        new mapboxgl.Marker()
          .setLngLat(restaurant.coordinates)
          .setPopup(new mapboxgl.Popup().setText(restaurant.name))
          .addTo(map);
      });
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

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
        <BingoCard />
      </div>
    </div>
  );
};

export default MainPage;
