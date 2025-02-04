'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DatabaseService } from '@/lib/services/database';
import AuthForm from '@/components/AuthForm';
import BingoCard from '@/components/BingoCard';
import dynamic from 'next/dynamic';
import CheckInModal from '@/components/CheckInModal';
import Image from 'next/image';
import Link from 'next/link';

// Dynamically import the map component with SSR disabled
const RestaurantMap = dynamic(
  () => import('@/components/RestaurantMap'),
  { ssr: false }
);

interface UserStats {
  visit_count: number;
  raffle_entries: number;
}

interface UserProfile {
  name: string | null;
}

type DatabaseError = {
  message?: string;
  code?: string;
};

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ visit_count: 0, raffle_entries: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisitTime, setLastVisitTime] = useState<number>(Date.now());
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  // Initialize and fetch initial data
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        if (!user) return;

        // Fetch user profile
        const profileData = await DatabaseService.users.getProfile(user.id);
        if (mounted) {
          setUserProfile(profileData);
        }

        // Fetch initial stats
        try {
          const stats = await DatabaseService.userStats.get(user.id);
          if (mounted) {
            setUserStats(stats);
          }
        } catch (error) {
          const dbError = error as DatabaseError;
          if (dbError.message?.includes('No data returned')) {
            // Create initial stats if they don't exist
            const newStats = await DatabaseService.userStats.createOrUpdate(user.id, {
              visit_count: 0,
              raffle_entries: 0
            });
            if (mounted) {
              setUserStats(newStats);
            }
          } else {
            throw error;
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

    if (!authLoading) {
      initialize();
    }

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  // Handle new visits
  const handleCheckIn = async () => {
    if (!user) return;
    
    try {
      const stats = await DatabaseService.userStats.get(user.id);
      setUserStats(stats);
    } catch (err) {
      console.error('Error updating stats after check-in:', err);
    }
    
    setLastVisitTime(Date.now());
  };

  if (loading && authLoading) {
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
            <div className="mb-8 text-center">
              <div className="mb-6">
                <Image
                  src="/PICC-logo.png"
                  alt="Pleasure Island Chamber of Commerce"
                  width={300}
                  height={150}
                  className="mx-auto"
                  priority
                />
              </div>
              <h1 className="space-y-1">
                <span className="block text-xl font-medium text-gray-600">
                  Welcome to
                </span>
                <span className="block text-3xl font-extrabold text-gray-900 tracking-tight">
                  Restaurant Week Bingo
                </span>
              </h1>
              <Link 
                href="/how-to-play"
                className="inline-block mt-4 px-6 py-3 text-sm font-medium text-coral-700 hover:text-coral-800 bg-coral-100 hover:bg-coral-200 rounded-lg transition-colors"
              >
                Learn How to Play
              </Link>
            </div>
            <AuthForm />
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 animate-fade-in">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-medium text-gray-900">
                Welcome, {userProfile?.name || user.email?.split('@')[0]}!
              </h2>
              <div className="flex gap-4 items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center bg-coral-100 text-coral-700 rounded-full h-6 w-6 font-medium">
                    {userStats.visit_count}
                  </span>
                  <span className="text-gray-600">restaurants visited</span>
                </div>
                {userStats.raffle_entries > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center bg-coral-100 text-coral-700 rounded-full h-6 w-6 font-medium">
                      {userStats.raffle_entries}
                    </span>
                    <span className="text-gray-600">raffle {userStats.raffle_entries === 1 ? 'entry' : 'entries'}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="btn btn-primary"
            >
              Check In
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card p-4">
                <RestaurantMap lastCheckIn={lastVisitTime} />
              </div>
            </div>
            <div className="card p-6">
              <BingoCard key={lastVisitTime} />
            </div>
          </div>

          <CheckInModal
            isOpen={isCheckInModalOpen}
            onClose={() => setIsCheckInModalOpen(false)}
            onCheckIn={handleCheckIn}
          />
        </div>
      )}
    </main>
  );
}
