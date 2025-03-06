'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import type { MarkerCluster } from 'leaflet';

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
  phone: string | null;
  url: string | null;
  description: string | null;
  promo_offer: string | null;
  latitude: number;
  longitude: number;
  is_retail: boolean;
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

export default function RestaurantMap({ lastCheckIn }: RestaurantMapProps) {
  const { user, isLoaded } = useUser();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        
        setRestaurants(restaurantsData.map(r => ({
          ...r,
          visited: false
        })));
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
        
        setError(null);
      } catch (e) {
        console.error('Error fetching user visits:', e);
        setError('Failed to load visit history');
      }
    }

    if (isLoaded && user) {
      fetchUserVisits();
    }
  }, [user?.id, isLoaded, lastCheckIn]);

  if (loading || !isLoaded) {
    return <div>Loading map...</div>;
  }

  const center = { lat: 34.035, lng: -77.893 }; // Carolina Beach, NC

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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