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
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in">
            <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
              Restaurant Week Bingo
            </h1>
            <AuthForm />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 animate-fade-in">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <p className="text-gray-600">
                Restaurants visited: {userStats.visit_count}
                {userStats.raffle_entries > 0 && (
                  <span className="ml-2 text-coral-500 font-medium">
                    ({userStats.raffle_entries} raffle {userStats.raffle_entries === 1 ? 'entry' : 'entries'} earned!)
                  </span>
                )}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card">
                <CheckInForm onCheckIn={handleCheckIn} />
              </div>
              <div className="card p-4">
                <RestaurantMap />
              </div>
            </div>
            <div className="card p-6">
              <BingoCard key={lastVisitTime} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
