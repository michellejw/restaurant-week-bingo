'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
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
              <div className="text-sm">
                <h3 className="font-semibold mb-1">{restaurant.name}</h3>
                <p className="text-gray-600">{restaurant.address}</p>
                {restaurant.visited && (
                  <p className="text-coral-600 mt-1">✓ Visited</p>
                )}
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
              <div className="text-sm">
                <h3 className="font-semibold mb-1">{sponsor.name}</h3>
                <p className="text-gray-600">{sponsor.address}</p>
                {sponsor.promo_offer && (
                  <p className="text-amber-600 mt-1">🎁 {sponsor.promo_offer}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}