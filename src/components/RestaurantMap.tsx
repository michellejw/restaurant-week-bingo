'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Restaurant, Sponsor } from '@/types/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Modern SVG marker icons - moved inside component to ensure client-side only
const createIcon = (fillColor: string, isRetail: boolean = false, isSelected: boolean = false) => {
  const size: [number, number] = isSelected ? [28, 42] : [20, 30];
  const viewBox = isSelected ? "0 0 28 42" : "0 0 20 30";
  
  return new L.DivIcon({
    html: `
      <svg width="${size[0]}" height="${size[1]}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- White outline/stroke -->
        <path d="M${isSelected ? '14' : '10'} 1C${isSelected ? '7.04116 1 1.4 6.64116 1.4 14C1.4 23.3333 14 41 14 41C14 41 26.6 23.3333 26.6 14C26.6 6.64116 20.9588 1 14 1Z' : '5.02944 1 1 5.02944 1 10C1 16.6667 10 29 10 29C10 29 19 16.6667 19 10C19 5.02944 14.9706 1 10 1Z'}" fill="white" stroke="#333" stroke-width="${isSelected ? '2' : '1'}"/>
        <!-- Main marker fill -->
        <path d="M${isSelected ? '14' : '10'} ${isSelected ? '2.8' : '2'}C${isSelected ? '8.12325 2.8 2.8 8.12325 2.8 14C2.8 22.4 14 38.2 14 38.2C14 38.2 25.2 22.4 25.2 14C25.2 8.12325 19.8767 2.8 14 2.8Z' : '5.58172 2 2 5.58172 2 10C2 16 10 27 10 27C10 27 18 16 18 10C18 5.58172 14.4183 2 10 2Z'}" fill="${fillColor}"/>
        ${isRetail ? `<circle cx="${isSelected ? '14' : '10'}" cy="${isSelected ? '14' : '10'}" r="${isSelected ? '5.6' : '4'}" fill="white" stroke="#333" stroke-width="${isSelected ? '1.4' : '1'}"/>` : ''}
        ${isSelected ? `<circle cx="${isSelected ? '14' : '10'}" cy="${isSelected ? '14' : '10'}" r="3" fill="white" opacity="0.8"/>` : ''}
      </svg>
    `,
    className: isSelected ? 'selected-marker' : '',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]]
  });
};

type LatLngBounds = [[number, number], [number, number]];

// Helper components for map functionality
function FitBounds({ bounds }: { bounds: LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);
  return null;
}

function ResetView({ restaurants, targetRestaurantId, hasEverBeenTargeted }: { 
  restaurants: Restaurant[], 
  targetRestaurantId?: string | null,
  hasEverBeenTargeted?: boolean
}) {
  // Don't reset if:
  // 1. No restaurants
  // 2. A restaurant is currently selected
  // 3. A restaurant has ever been selected (to prevent zoom-out on deselection)
  if (!restaurants.length || targetRestaurantId || hasEverBeenTargeted) return null;

  // Calculate bounds from restaurant locations
  const lats = restaurants.map(r => r.latitude);
  const lngs = restaurants.map(r => r.longitude);
  const bounds: LatLngBounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];

  return <FitBounds bounds={bounds} />;
}

// Component to handle map clicks for deselection
function MapClickHandler({ onRestaurantDeselect, targetRestaurantId }: { onRestaurantDeselect?: () => void, targetRestaurantId: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    const handleMapClick = () => {
      if (targetRestaurantId && onRestaurantDeselect) {
        onRestaurantDeselect();
      }
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onRestaurantDeselect, targetRestaurantId]);
  
  return null;
}

// Component to center map on a specific restaurant
function MapController({ 
  targetRestaurantId, 
  restaurants, 
  onSetHasEverBeenTargeted 
}: { 
  targetRestaurantId: string | null, 
  restaurants: Restaurant[],
  onSetHasEverBeenTargeted: () => void
}) {
  const map = useMap();
  
  useEffect(() => {
    if (targetRestaurantId && restaurants.length > 0) {
      const restaurant = restaurants.find(r => r.id === targetRestaurantId);
      if (restaurant) {
        // Mark that we've ever targeted a restaurant
        onSetHasEverBeenTargeted();
        
        const targetLat = restaurant.latitude;
        const targetLng = restaurant.longitude;
        
        // Always set view regardless of current position
        // Stop any ongoing animations first
        map.stop();
        
        // Set view with consistent zoom level and smooth animation
        map.setView([targetLat, targetLng], 16, {
          animate: true,
          duration: 1.0,
          easeLinearity: 0.25
        });
      }
    }
  }, [map, targetRestaurantId, restaurants, onSetHasEverBeenTargeted]);
  
  return null;
}

interface RestaurantMapProps {
  onVisitUpdate?: () => void;
  targetRestaurantId?: string | null;
  onRestaurantSelect?: (restaurantId: string) => void;
  onRestaurantDeselect?: () => void;
}


export default function RestaurantMap({ onVisitUpdate, targetRestaurantId, onRestaurantSelect, onRestaurantDeselect }: RestaurantMapProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEverBeenTargeted, setHasEverBeenTargeted] = useState(false);
  const [icons, setIcons] = useState<{ 
    visited: L.DivIcon; 
    unvisited: L.DivIcon; 
    retail: L.DivIcon;
    selectedVisited: L.DivIcon;
    selectedUnvisited: L.DivIcon;
  } | null>(null);

  useEffect(() => {
    setIcons({
      visited: createIcon('#10b981'), // Emerald green for visited
      unvisited: createIcon('#6b7280'), // Gray for unvisited  
      retail: createIcon('#f59e0b', true), // Amber for sponsors
      selectedVisited: createIcon('#dc2626', false, true), // Bright red for selected visited
      selectedUnvisited: createIcon('#dc2626', false, true) // Bright red for selected unvisited
    });
  }, []);

  // Fetch restaurants, sponsors, and user visits all together
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const response = await fetch('/api/restaurants');
        if (!response.ok) {
          throw new Error('Failed to fetch map data');
        }

        const data = await response.json();
        setRestaurants(data.restaurants || []);
        setSponsors(data.sponsors || []);
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [onVisitUpdate]);

  if (loading) {
    return <div>Loading map...</div>;
  }

  const center = { lat: 34.035, lng: -77.893 }; // Carolina Beach, NC

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ResetView 
        restaurants={restaurants} 
        targetRestaurantId={targetRestaurantId} 
        hasEverBeenTargeted={hasEverBeenTargeted}
      />
      <MapController 
        targetRestaurantId={targetRestaurantId || null} 
        restaurants={restaurants}
        onSetHasEverBeenTargeted={() => setHasEverBeenTargeted(true)}
      />
      <MapClickHandler onRestaurantDeselect={onRestaurantDeselect} targetRestaurantId={targetRestaurantId || null} />
      {/* Restaurants */}
      {restaurants.map((restaurant, index) => {
        const isSelected = targetRestaurantId === restaurant.id;
        let icon;
        let zIndex;
        
        if (isSelected) {
          icon = restaurant.visited ? icons?.selectedVisited : icons?.selectedUnvisited;
          zIndex = 2000; // Selected markers on top of everything
        } else {
          icon = restaurant.visited ? icons?.visited : icons?.unvisited;
          zIndex = restaurant.visited ? 1000 : 500 + index;
        }
        
        return (
          <Marker
            key={restaurant.id}
            position={[restaurant.latitude, restaurant.longitude]}
            icon={icon}
            zIndexOffset={zIndex}
            eventHandlers={{
              click: () => {
                if (isSelected) {
                  // If clicking the already selected restaurant, deselect it
                  onRestaurantDeselect?.();
                } else {
                  // If clicking a different restaurant, select it (this will auto-deselect previous)
                  onRestaurantSelect?.(restaurant.id);
                }
              }
            }}
          >
          <Popup>
            <div className="text-sm max-w-[250px]">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{restaurant.name}</h3>
              <div className="space-y-2">
                <p className="text-gray-600 flex items-start">
                  <svg className="w-4 h-4 mr-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {restaurant.address}
                </p>
                {restaurant.phone && (
                  <p className="text-gray-600 flex items-center">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {restaurant.phone}
                  </p>
                )}
                {restaurant.url && (
                  <a 
                    href={restaurant.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-coral-600 hover:text-coral-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit Website
                  </a>
                )}
                {restaurant.description && (
                  <p className="text-gray-600 mt-2 border-t pt-2">
                    {restaurant.description}
                  </p>
                )}
                {restaurant.specials && (
                  <p className="text-coral-600 flex items-start mt-2 border-t pt-2">
                    <svg className="w-4 h-4 mr-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <span><strong>Special:</strong> {restaurant.specials}</span>
                  </p>
                )}
                {restaurant.promotions && (
                  <p className="text-coral-600 flex items-start mt-2 border-t pt-2">
                    <svg className="w-4 h-4 mr-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span><strong>Promotion:</strong> {restaurant.promotions}</span>
                  </p>
                )}
                {restaurant.visited && (
                  <p className="text-coral-600 flex items-center mt-2">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Visited
                  </p>
                )}
              </div>
            </div>
          </Popup>
          </Marker>
        );
      })}
      {/* Sponsors */}
      {sponsors.map((sponsor) => (
        <Marker
          key={sponsor.id}
          position={[sponsor.latitude, sponsor.longitude]}
          icon={icons?.retail}
        >
          <Popup>
            <div className="text-sm max-w-[250px]">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{sponsor.name}</h3>
              <div className="space-y-2">
                <p className="text-gray-600 flex items-start">
                  <svg className="w-4 h-4 mr-1 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {sponsor.address}
                </p>
                {sponsor.phone && (
                  <p className="text-gray-600 flex items-center">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {sponsor.phone}
                  </p>
                )}
                {sponsor.promo_offer && (
                  <p className="text-amber-600 flex items-center mt-2">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    {sponsor.promo_offer}
                  </p>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
