'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalUsers: 0,
    totalVisits: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total restaurants
        const { count: restaurantCount } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true });

        // Get total users
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Get total visits
        const { count: visitCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalRestaurants: restaurantCount || 0,
          totalUsers: userCount || 0,
          totalVisits: visitCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Restaurants</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalRestaurants}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Visits</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalVisits}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/restaurants/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Add New Restaurant
          </a>
          <a
            href="/admin/qr-codes/generate"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Generate QR Codes
          </a>
        </div>
      </div>
    </div>
  );
} 