'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import type { MarkerCluster } from 'leaflet';

// Modern SVG marker icons - moved inside component to ensure client-side only
const createIcon = (fillColor: string, isRetail: boolean = false) => {
  if (isRetail) {
    return L.divIcon({
      html: `
        <div style="
          width: 32px; 
          height: 42px; 
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            width: 32px;
            height: 32px;
            background-color: ${fillColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            <span class="material-symbols-outlined" style="
              font-variation-settings: 'FILL' 1;
              color: white;
              font-size: 20px;
            ">shopping_bag</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 12px solid ${fillColor};
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
          "></div>
        </div>
      `,
      className: '',
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -42]
    });
  }

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
  phone?: string | null;
}

interface Sponsor {
  id: string;
  name: string;
  address: string;
  url: string | null;
  latitude: number;
  longitude: number;
  description?: string | null;
  phone?: string | null;
  is_retail: boolean;
  promo_offer?: string | null;
  created_at: string;
}

interface ApiResponse {
  restaurants: Restaurant[];
  sponsors: Sponsor[];
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
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

// Create a custom cluster icon that shows visited/unvisited proportions
const createClusterIcon = (cluster: MarkerCluster) => {
  // Get all markers in the cluster
  const markers = cluster.getAllChildMarkers();
  const childCount = cluster.getChildCount();
  
  // Count visited restaurants by looking at the original data
  const visited = markers.reduce((count: number, marker: L.Marker) => {
    // We know the marker has our custom restaurant property
    const restaurant = (marker.options as { restaurant?: Restaurant })?.restaurant;
    return count + (restaurant?.visited ? 1 : 0);
  }, 0);
  
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
  totalText.textContent = childCount.toString();
  
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

// Add a type for any location with lat/lng
interface Location {
  latitude: number;
  longitude: number;
}

const calculateBounds = (locations: Location[]): LatLngBounds | null => {
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

export default function RestaurantMap({ lastCheckIn }: RestaurantMapProps) {
  const { user, isSignedIn } = useUser();
  const { supabaseId, loading: userLoading } = useSupabaseUser();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVisits, setUserVisits] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);
  const [icons, setIcons] = useState<{ visited: L.DivIcon; unvisited: L.DivIcon; retail: L.DivIcon } | null>(null);

  useEffect(() => {
    setIsClient(true);
    setIcons({
      visited: createIcon('#ff5436'),
      unvisited: createIcon('#94a3b8'),
      retail: createIcon('#F59E0B', true)
    });
  }, []);

  // Fetch restaurants and sponsors
  useEffect(() => {
    async function fetchData() {
      try {
        const [restaurantsData, sponsorsData] = await Promise.all([
          DatabaseService.restaurants.getAll(),
          DatabaseService.sponsors.getAll()
        ]);
        
        // Add visited property to restaurants
        const restaurantsWithVisited = restaurantsData.map(r => ({
          ...r,
          visited: false // Will be updated when user visits are fetched
        }));
        
        setRestaurants(restaurantsWithVisited);
        setSponsors(sponsorsData);
        setError(null);
      } catch (e) {
        console.error('Error fetching data:', e);
        setError('Failed to load restaurants and sponsors');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch user visits when user is available
  useEffect(() => {
    async function fetchUserVisits() {
      if (!supabaseId || !isSignedIn) {
        setUserVisits(new Set());
        return;
      }

      try {
        const visits = await DatabaseService.visits.getByUser(supabaseId);
        const visitedIds = new Set(visits.map(v => v.restaurant_id));
        
        // Update restaurants with visited status
        setRestaurants(current => 
          current.map(r => ({
            ...r,
            visited: visitedIds.has(r.id)
          }))
        );
        
        setUserVisits(visitedIds);
        setError(null);
      } catch (e) {
        console.error('Error fetching user visits:', e);
        setError('Failed to load visit history');
      }
    }

    if (!userLoading && supabaseId) {
      fetchUserVisits();
    }
  }, [supabaseId, userLoading, isSignedIn, lastCheckIn]);

  // Early return for loading state
  if (loading || userLoading) {
    return <div>Loading...</div>;
  }

  // Early return for error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Calculate map bounds from all locations
  const allLocations = [...restaurants, ...sponsors];
  const mapBounds = calculateBounds(allLocations);

  if (!mapBounds) {
    return <div>No locations available</div>;
  }

  if (!isClient || !icons) {
    return <div>Loading map...</div>;
  }

  const center: [number, number] = mapBounds ? [
    (mapBounds[0][0] + mapBounds[1][0]) / 2,
    (mapBounds[0][1] + mapBounds[1][1]) / 2
  ] : [37.7749, -122.4194]; // Default to SF

  return (
    <div className="relative w-full h-[500px]">
      {isClient && icons && (
        <MapContainer
          style={mapContainerStyle}
          center={center}
          zoom={mapBounds ? undefined : 14}
          minZoom={11}
          maxZoom={18}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {mapBounds && <FitBounds bounds={mapBounds} />}
          {mapBounds && <ResetView bounds={mapBounds} />}
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
                // @ts-expect-error - restaurant prop is needed for cluster counting
                restaurant={restaurant}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-bold text-lg mb-2 text-coral-600">{restaurant.name}</h3>
                    <div className="space-y-2">
                      <p className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{restaurant.address}</span>
                      </p>
                      {restaurant.phone && (
                        <p className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a href={`tel:${restaurant.phone}`} className="text-blue-600 hover:text-blue-800">
                            {restaurant.phone}
                          </a>
                        </p>
                      )}
                      {restaurant.description && (
                        <p className="flex items-start gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{restaurant.description}</span>
                        </p>
                      )}
                      {restaurant.url && (
                        <p className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <a
                            href={restaurant.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {sponsors.map((sponsor) => (
              <Marker
                key={sponsor.id}
                position={[sponsor.latitude, sponsor.longitude]}
                icon={icons.retail}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-bold text-lg mb-2 text-indigo-600">{sponsor.name}</h3>
                    <div className="space-y-2">
                      <p className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{sponsor.address}</span>
                      </p>
                      {sponsor.phone && (
                        <p className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a href={`tel:${sponsor.phone}`} className="text-blue-600 hover:text-blue-800">
                            {sponsor.phone}
                          </a>
                        </p>
                      )}
                      {sponsor.description && (
                        <p className="flex items-start gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{sponsor.description}</span>
                        </p>
                      )}
                      {sponsor.url && (
                        <p className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <a
                            href={sponsor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      )}
    </div>
  );
} 