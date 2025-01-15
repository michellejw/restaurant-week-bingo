'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import type { Restaurant, RestaurantVisit } from '@/types'

interface RestaurantMapProps {
  restaurants: Restaurant[]
  visits: RestaurantVisit[]
}

export default function RestaurantMap({ restaurants, visits }: RestaurantMapProps) {
  const visitedRestaurantIds = visits.map(visit => visit.restaurantId)

  // Calculate center of all restaurants
  const center = restaurants.length > 0
    ? {
        lat: restaurants.reduce((sum, r) => sum + r.latitude, 0) / restaurants.length,
        lng: restaurants.reduce((sum, r) => sum + r.longitude, 0) / restaurants.length,
      }
    : { lat: 0, lng: 0 } // Default center if no restaurants

  const markerIcon = (visited: boolean) => new Icon({
    iconUrl: visited ? '/marker-visited.svg' : '/marker.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

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
      {restaurants.map(restaurant => (
        <Marker
          key={restaurant.id}
          position={[restaurant.latitude, restaurant.longitude]}
          icon={markerIcon(visitedRestaurantIds.includes(restaurant.id))}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-bold">{restaurant.name}</h3>
              <p>{restaurant.address}</p>
              {restaurant.url && (
                <a
                  href={restaurant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800"
                >
                  Visit Website
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
} 