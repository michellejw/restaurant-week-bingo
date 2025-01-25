'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthForm from '@/components/AuthForm';
import BingoCard from '@/components/BingoCard';
import dynamic from 'next/dynamic';
import CheckInForm from '@/components/CheckInForm';
import { User } from '@supabase/supabase-js';

// Dynamically import the map component with SSR disabled
const RestaurantMap = dynamic(
  () => import('@/components/RestaurantMap'),
  { ssr: false }
);

interface UserStats {
  visit_count: number;
  raffle_entries: number;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ visit_count: 0, raffle_entries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisitTime, setLastVisitTime] = useState<number>(Date.now());

  // Initialize auth and fetch initial data
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          // Fetch initial stats
          const { data, error } = await supabase
            .from('user_stats')
            .select('visit_count, raffle_entries')
            .eq('user_id', session.user.id)
            .single();

          if (!mounted) return;

          if (error && error.code === 'PGRST116') {
            // Create initial stats if they don't exist
            const { data: newData, error: insertError } = await supabase
              .from('user_stats')
              .insert([{ user_id: session.user.id, visit_count: 0, raffle_entries: 0 }])
              .select()
              .single();
            
            if (mounted && !insertError) {
              setUserStats(newData || { visit_count: 0, raffle_entries: 0 });
            }
          } else if (!error && data) {
            if (mounted) {
              setUserStats(data);
            }
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        // Fetch latest stats whenever auth state changes
        const { data, error } = await supabase
          .from('user_stats')
          .select('visit_count, raffle_entries')
          .eq('user_id', session.user.id)
          .single();
          
        if (mounted && !error && data) {
          setUserStats(data);
        }
      } else {
        setUser(null);
        setUserStats({ visit_count: 0, raffle_entries: 0 });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle new visits
  const handleCheckIn = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('visit_count, raffle_entries')
        .eq('user_id', user.id)
        .single();
        
      if (!error && data) {
        setUserStats(data);
      }
    } catch (err) {
      console.error('Error updating stats after check-in:', err);
    }
    
    setLastVisitTime(Date.now());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Loading...</div>
          {error && (
            <div className="text-red-600 text-sm">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {!user ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full px-4">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
              Restaurant Week Bingo
            </h1>
            <AuthForm />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Week Bingo</h1>
              <p className="text-gray-600">
                Restaurants visited: {userStats.visit_count}
                {userStats.raffle_entries > 0 && (
                  <span className="ml-2 text-purple-600">
                    ({userStats.raffle_entries} raffle {userStats.raffle_entries === 1 ? 'entry' : 'entries'} earned!)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <RestaurantMap />
              </div>
              <CheckInForm onCheckIn={handleCheckIn} />
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <BingoCard key={lastVisitTime} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
