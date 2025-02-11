'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useAuth } from '@/lib/AuthContext';
import { DatabaseService } from '@/lib/services/database';

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
  url: string | null;
  latitude: number;
  longitude: number;
  visited: boolean;
  description?: string | null;
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

// Add FitBounds component to handle map fitting
function FitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [50, 50], // Add padding in pixels
        maxZoom: 15 // Limit max zoom when fitting bounds
      });
    }
  }, [map, bounds]);
  return null;
}

// Define a type for markers with visited status
type MarkerWithVisitedStatus = L.Marker & { visitedStatus?: boolean };

// Create a custom cluster icon that shows visited/unvisited proportions
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const markers = cluster.getAllChildMarkers() as MarkerWithVisitedStatus[];
  const visited = markers.reduce((count, marker) => {
    return count + (marker.visitedStatus ? 1 : 0);
  }, 0);
  const total = markers.length;
  const size = 40;

  // Create an SVG for the cluster
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', `${size}px`);
  svg.setAttribute('height', `${size}px`);
  svg.setAttribute('viewBox', '0 0 40 40');

  // Background circle
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '20');
  circle.setAttribute('cy', '20');
  circle.setAttribute('r', '18');
  circle.setAttribute('fill', '#ffffff');
  circle.setAttribute('stroke', '#94a3b8');
  circle.setAttribute('stroke-width', '2');
  svg.appendChild(circle);

  // Add the text showing "visited/total"
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '20');
  text.setAttribute('y', '24');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '14px');
  text.setAttribute('font-weight', 'bold');
  
  // First number (visited) in coral
  const visitedText = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  visitedText.setAttribute('fill', '#ff5436');
  visitedText.textContent = visited.toString();
  
  // Slash in gray
  const slashText = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  slashText.setAttribute('fill', '#94a3b8');
  slashText.textContent = '/';
  
  // Total number in gray
  const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
  totalText.setAttribute('fill', '#94a3b8');
  totalText.textContent = total.toString();
  
  text.appendChild(visitedText);
  text.appendChild(slashText);
  text.appendChild(totalText);
  svg.appendChild(text);

  return L.divIcon({
    html: svg.outerHTML,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: [size/2, size/2]
  });
};

// Add ResetView component
function ResetView({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  
  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: '80px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={() => {
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 15
            });
          }}
          className="leaflet-control-zoom-in"
          style={{ 
            width: '30px', 
            height: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '18px',
            cursor: 'pointer'
          }}
          title="Reset map view"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-4 h-4"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function RestaurantMap({ lastCheckIn }: RestaurantMapProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [icons, setIcons] = useState<{ visited: L.DivIcon; unvisited: L.DivIcon } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setIsClient(true);
    setIcons({
      visited: createIcon('#ff5436'),
      unvisited: createIcon('#94a3b8')
    });
  }, []);

  const fetchRestaurants = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching restaurants...');
      
      // Get all restaurants
      const restaurantsData = await DatabaseService.restaurants.getAll();
      
      // Get user's visits
      const visits = await DatabaseService.visits.getByUser(user.id);
      const visitedIds = new Set(visits.map(v => v.restaurant_id));
      
      const processedRestaurants = restaurantsData.map(restaurant => ({
        ...restaurant,
        visited: visitedIds.has(restaurant.id)
      }));

      setRestaurants(processedRestaurants);
      setBounds(calculateBounds(processedRestaurants));
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch on mount and when lastCheckIn changes
  useEffect(() => {
    if (isClient && !authLoading) {
      console.log('Fetching due to lastCheckIn update:', lastCheckIn);
      fetchRestaurants();
    }
  }, [fetchRestaurants, isClient, lastCheckIn, authLoading]);

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

    // Increase padding to 10% for better visibility
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

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

  if (!user) {
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
    <div className="relative w-full h-[400px]">
      {isClient && icons && (
        <MapContainer
          style={mapContainerStyle}
          center={center}
          zoom={bounds ? undefined : 14}
          minZoom={11}
          maxZoom={18}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {bounds && <FitBounds bounds={bounds} />}
          {bounds && <ResetView bounds={bounds} />}
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterIcon}
            showCoverageOnHover={false}
            maxClusterRadius={40}
            disableClusteringAtZoom={15}
            spiderfyOnMaxZoom={false}
            removeOutsideVisibleBounds={true}
            animate={false}
          >
            {restaurants.map((restaurant) => (
              <Marker
                key={restaurant.id}
                position={[restaurant.latitude, restaurant.longitude]}
                icon={restaurant.visited ? icons.visited : icons.unvisited}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold">{restaurant.name}</h3>
                    <p>{restaurant.address}</p>
                    {restaurant.url && (
                      <a
                        href={restaurant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
} 