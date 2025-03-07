'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import type { Restaurant, Sponsor } from '@/types/supabase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Modern SVG marker icons - moved inside component to ensure client-side only
const createIcon = (fillColor: string, isRetail: boolean = false) => {
  return new L.DivIcon({
    html: `
      <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.38286 0 0 5.38286 0 12C0 20.5714 12 36 12 36C12 36 24 20.5714 24 12C24 5.38286 18.6171 0 12 0Z" fill="${fillColor}"/>
        ${isRetail ? '<circle cx="12" cy="12" r="6" fill="white"/>' : ''}
      </svg>
    `,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
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

function ResetView({ restaurants }: { restaurants: Restaurant[] }) {
  if (!restaurants.length) return null;

  // Calculate bounds from restaurant locations
  const lats = restaurants.map(r => r.latitude);
  const lngs = restaurants.map(r => r.longitude);
  const bounds: LatLngBounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];

  return <FitBounds bounds={bounds} />;
}

export default function RestaurantMap() {
  const { user } = useUser();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [icons, setIcons] = useState<{ visited: L.DivIcon; unvisited: L.DivIcon; retail: L.DivIcon } | null>(null);

  useEffect(() => {
    setIcons({
      visited: createIcon('#ff5436'),
      unvisited: createIcon('#94a3b8'),
      retail: createIcon('#F59E0B', true)
    });
  }, []);

  // Fetch restaurants and sponsors
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const [restaurantsData, sponsorsData] = await Promise.all([
          DatabaseService.restaurants.getAll(),
          DatabaseService.sponsors.getAll()
        ]);
        
        setRestaurants(restaurantsData.map(r => ({
          ...r,
          visited: false
        })));
        setSponsors(sponsorsData);
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRestaurants();
    }
  }, [user]);

  // Fetch user visits when user is available
  useEffect(() => {
    const fetchUserVisits = async () => {
      if (!user?.id) {
        return;
      }

      try {
        const visits = await DatabaseService.visits.getByUser(user.id);
        const visitedIds = new Set(visits.map(v => v.restaurant_id));
        
        setRestaurants(current => 
          current.map(r => ({
            ...r,
            visited: visitedIds.has(r.id)
          }))
        );
      } catch (e) {
        console.error('Error fetching user visits:', e);
      }
    };

    if (user) {
      fetchUserVisits();
    }
  }, [user]);

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
      <ResetView restaurants={restaurants} />
      <MarkerClusterGroup>
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.latitude, restaurant.longitude]}
            icon={restaurant.visited ? icons?.visited : icons?.unvisited}
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
        ))}
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
      </MarkerClusterGroup>
    </MapContainer>
  );
}