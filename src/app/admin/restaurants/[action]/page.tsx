'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Restaurant } from '@/types/restaurant';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function RestaurantForm() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: userLoading } = useUser();
  const isEditing = params.action !== 'new';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({
    name: '',
    address: '',
    website_url: '',
    latitude: 0,
    longitude: 0,
  });

  // Check if user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (user?.email) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('isAdmin')
            .eq('email', user.email)
            .single();

          if (error) throw error;
          setIsAdmin(!!data?.isAdmin);
          
          if (!data?.isAdmin) {
            router.push('/');
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
          router.push('/');
        }
      }
    }

    if (!userLoading) {
      checkAdminStatus();
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isEditing && params.action) {
      // Fetch restaurant data if editing
      const fetchRestaurant = async () => {
        try {
          const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', params.action)
            .single();

          if (error) throw error;
          if (data) setRestaurant(data);
        } catch (err) {
          console.error('Error fetching restaurant:', err);
          setError('Failed to load restaurant');
        }
      };

      fetchRestaurant();
    }
  }, [isEditing, params.action]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Create a copy of the restaurant data for submission
    const restaurantData = {
      name: restaurant.name,
      address: restaurant.address,
      website_url: restaurant.website_url,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    };

    // Format the URL if needed
    if (restaurantData.website_url) {
      try {
        // Try to create a URL object to test validity
        new URL(restaurantData.website_url);
      } catch (err) {
        // If it fails, try adding https://
        try {
          const urlWithProtocol = `https://${restaurantData.website_url}`;
          new URL(urlWithProtocol);
          restaurantData.website_url = urlWithProtocol;
        } catch (err) {
          setError('Please enter a valid website URL');
          setLoading(false);
          return;
        }
      }
    }

    // Validate coordinates
    if (isNaN(Number(restaurantData.latitude)) || isNaN(Number(restaurantData.longitude))) {
      setError('Please enter valid latitude and longitude values');
      setLoading(false);
      return;
    }

    // Ensure coordinates are numbers
    restaurantData.latitude = Number(restaurantData.latitude);
    restaurantData.longitude = Number(restaurantData.longitude);

    try {
      if (isEditing) {
        // Handle editing existing restaurant
        const { error } = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', params.action);

        if (error) throw error;
      } else {
        // Create new restaurant using our API endpoint
        const response = await fetch('/api/admin/restaurants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(restaurantData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create restaurant');
        }
      }

      router.push('/admin/restaurants');
    } catch (err) {
      console.error('Error saving restaurant:', err);
      setError(err instanceof Error ? err.message : 'Failed to save restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for coordinates to prevent NaN
    if (name === 'latitude' || name === 'longitude') {
      // Allow empty string or valid number
      const numberValue = value === '' ? 0 : Number(value);
      if (!isNaN(numberValue)) {
        setRestaurant(prev => ({
          ...prev,
          [name]: numberValue
        }));
      }
      return;
    }

    // Handle other fields normally
    setRestaurant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEditing ? 'Edit Restaurant' : 'Add New Restaurant'}
      </h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Restaurant Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={restaurant.name || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            required
            value={restaurant.address || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
            Website URL
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="website_url"
              name="website_url"
              required
              placeholder="www.example.com"
              value={restaurant.website_url || ''}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="mt-1 text-sm text-gray-500">
              Enter URL with or without http:// - we'll add it if needed
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              id="latitude"
              name="latitude"
              required
              value={restaurant.latitude || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              id="longitude"
              name="longitude"
              required
              value={restaurant.longitude || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/restaurants')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Restaurant' : 'Add Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
} 