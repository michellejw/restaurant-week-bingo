'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import * as Plot from '@observablehq/plot';
import OverallStatsCards from './components/OverallStatsCards';

// Horizontal bar chart for restaurant visits
function RestaurantVisitsChart({ data }: { data: { name: string; visits: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    console.log('Restaurant visits data:', data);
    
    if (!data.length) {
      const p = document.createElement('p');
      p.textContent = 'No restaurant data available';
      p.className = 'text-gray-500 p-4';
      containerRef.current.appendChild(p);
      return;
    }

    try {
      // Filter out restaurants with 0 visits for cleaner display
      const restaurantsWithVisits = data.filter(r => r.visits > 0);
      
      console.log('Restaurants with visits:', restaurantsWithVisits);

      const plot = Plot.plot({
        title: "Restaurant Visit Counts",
        width: 900,
        height: Math.max(400, restaurantsWithVisits.length * 30 + 100), // Dynamic height based on number of restaurants
        marginLeft: 200, // More space for restaurant names
        marginBottom: 60,
        x: {
          label: "Number of visits →",
          grid: true,
        },
        y: {
          label: null, // No y-axis label since restaurant names are self-explanatory
        },
        marks: [
          Plot.barX(restaurantsWithVisits, {
            y: "name",
            x: "visits",
            fill: "steelblue",
            sort: {y: "x", reverse: true} // Sort descending by visit count
          }),
        ],
      });

      containerRef.current.appendChild(plot);
    } catch (error) {
      console.error('Restaurant chart error:', error);
      const errorEl = document.createElement('p');
      errorEl.textContent = 'Error creating restaurant chart';
      errorEl.className = 'text-red-500 p-4';
      containerRef.current.appendChild(errorEl);
    }
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Restaurants with visits: {data.filter(r => r.visits > 0).length}</p>
      </div>
    </div>
  );
}

// Simple component for user visits histogram
function UserVisitsHistogram({ data }: { data: number[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous plot
    containerRef.current.innerHTML = '';
    
    console.log('Histogram data:', data);
    
    if (!data.length) {
      const p = document.createElement('p');
      p.textContent = 'No data available';
      p.className = 'text-gray-500 p-4';
      containerRef.current.appendChild(p);
      return;
    }

    try {
      // Filter out zero visits
      const nonZeroData = data.filter(visits => visits > 0);
      console.log('Filtered data (no zeros):', nonZeroData);
      
      // Create histogram data with bins from 1 to 23
      const plotData = [];
      for (let visits = 1; visits <= 23; visits++) {
        const count = nonZeroData.filter(v => v === visits).length;
        plotData.push({
          visits: visits,
          count: count
        });
      }
      
      console.log('Plot data (1-23 bins):', plotData);

      // Try a minimal approach first
      const plot = Plot.plot({
        title: "Distribution of Visit Counts",
        width: 900,
        height: 400,
        marginBottom: 60,
        marks: [
          Plot.barY(plotData, {
            x: "visits",
            y: "count",
            fill: "steelblue"
          }),
          Plot.ruleY([0]),
        ],
      });
      
      console.log('Created plot element:', plot);

      containerRef.current.appendChild(plot);
    } catch (error) {
      console.error('Error creating plot:', error);
      
      // Fallback: try a simple test plot
      try {
        const testData = [{x: 5, y: 1}, {x: 8, y: 1}];
        const testPlot = Plot.plot({
          title: "Test Plot",
          marks: [
            Plot.barY(testData, {x: "x", y: "y", fill: "red"})
          ]
        });
        containerRef.current.appendChild(testPlot);
        console.log('Test plot worked!');
      } catch (testError) {
        console.error('Test plot also failed:', testError);
        const errorP = document.createElement('p');
        errorP.textContent = 'Plot library error occurred. Check console for details.';
        errorP.className = 'text-red-500 p-4';
        containerRef.current.appendChild(errorP);
      }
    }

    return () => {
      // Cleanup handled by clearing innerHTML above
    };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Total users: {data.length}</p>
        {data.filter(v => v > 0).length > 0 && (
          <p>Visit range: 1 to 23 visits (showing distribution for users with visits {'>'} 0)</p>
        )}
      </div>
    </div>
  );
}

export interface StatsData {
  userVisitCounts: number[];
  restaurantVisits: {
    name: string;
    visits: number;
  }[];
  overallStats: {
    totalVisits: number;
    totalUsers: number;
    totalRestaurants: number;
    avgVisitsPerUser: number;
  };
}

export default function StatsContent() {
  const { user } = useUser();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchStatsData = async () => {
      if (!user?.id) {
        setLoading(false);
        setError('Please sign in to view stats');
        return;
      }

      // Check if user is admin first
      try {
        const adminStatus = await DatabaseService.users.isAdmin(user.id);
        
        if (!adminStatus) {
          setLoading(false);
          setError('Access denied: Admin privileges required');
          return;
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setLoading(false);
        setError('Error verifying permissions');
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Fetch required data
        const [restaurants, visits] = await Promise.all([
          DatabaseService.restaurants.getAll(),
          fetchAllVisits(),
        ]);

        console.log('Raw visits:', visits);

        // Calculate user visit counts directly from visits data (more reliable)
        const userVisitCountMap = new Map<string, number>();
        visits.forEach(visit => {
          const currentCount = userVisitCountMap.get(visit.user_id) || 0;
          userVisitCountMap.set(visit.user_id, currentCount + 1);
        });
        
        // Get all unique users from visits
        const userVisitCounts = Array.from(userVisitCountMap.values());
        
        console.log('Calculated user visit counts:', userVisitCounts);
        console.log('User visit count map:', Array.from(userVisitCountMap.entries()));
        
        console.log('User visit counts for histogram:', userVisitCounts);
        
        // Process restaurant visit counts
        const visitCounts = new Map<string, number>();
        visits.forEach(visit => {
          const restaurantId = visit.restaurant_id;
          visitCounts.set(restaurantId, (visitCounts.get(restaurantId) || 0) + 1);
        });

        const restaurantVisits = restaurants.map(restaurant => ({
          name: restaurant.name,
          visits: visitCounts.get(restaurant.id) || 0,
        })).sort((a, b) => b.visits - a.visits); // Sort descending by visit count
        
        console.log('Restaurant visits:', restaurantVisits);

        // Calculate basic stats directly from raw data
        const totalUsers = userVisitCountMap.size; // Users who have made visits
        const totalRestaurants = restaurants.length;
        const totalVisits = visits.length; // Direct count from visits table
        const avgVisitsPerUser = totalUsers > 0 ? totalVisits / totalUsers : 0;

        const statsData: StatsData = {
          userVisitCounts,
          restaurantVisits,
          overallStats: {
            totalVisits,
            totalUsers,
            totalRestaurants,
            avgVisitsPerUser: Math.round(avgVisitsPerUser * 100) / 100,
          },
        };

        setData(statsData);
      } catch (err) {
        console.error('Error fetching stats data:', err);
        setError('Failed to load statistics data');
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, [user?.id, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-coral-500"></div>
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={handleRefresh} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-coral-700">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-coral-600 text-white rounded-lg hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>
      
      {/* Basic Stats */}
      <OverallStatsCards stats={data.overallStats} />
      
      {/* User Visits Histogram */}
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <p className="text-gray-600">Histogram showing how many visits each user has made (excluding users with 0 visits)</p>
        </div>
        
        <UserVisitsHistogram data={data.userVisitCounts} />
      </div>
      
      {/* Restaurant Visits Chart */}
      <div className="space-y-6">
        <div className="border-l-4 border-green-500 pl-4">
          <p className="text-gray-600">Visit counts by restaurant, sorted from highest to lowest</p>
        </div>
        
        <RestaurantVisitsChart data={data.restaurantVisits} />
      </div>
    </div>
  );
}

// Helper functions for data fetching
async function fetchAllVisits() {
  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

