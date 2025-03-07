'use client';

import { useEffect, useState } from 'react';
import { useUser, SignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import BingoCard from '@/components/BingoCard';
import dynamic from 'next/dynamic';
import CheckInModal from '@/components/CheckInModal';

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
  const { user, isLoaded } = useUser();
  const [userStats, setUserStats] = useState<UserStats>({ visit_count: 0, raffle_entries: 0 });
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize and fetch initial data
  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const initialize = async () => {
      if (!user?.id) {
        console.log('⏳ Waiting for user...');
        return;
      }

      try {
        console.log('🚀 Fetching user stats for ID:', user.id);
        // Fetch initial stats
        const stats = await DatabaseService.userStats.getOrCreate(user.id);
        console.log('📊 Received user stats:', stats);
        
        if (mounted) {
          setUserStats(stats);
          setRetryCount(0);
          console.log('✅ Updated user stats in state');
        }
      } catch (err) {
        console.error('❌ Initialization error:', err);
        if (mounted) {
          // If we haven't retried too many times, try again after a delay
          if (retryCount < 3) {
            console.log(`🔄 Will retry in ${(retryCount + 1) * 1000}ms (attempt ${retryCount + 1}/3)`);
            retryTimeout = setTimeout(() => {
              if (mounted) {
                setRetryCount(prev => prev + 1);
              }
            }, (retryCount + 1) * 1000);
          }
        }
      } finally {
        if (mounted) {
          console.log('✅ Loading complete');
        }
      }
    };

    if (isLoaded) {
      console.log('🔄 Conditions met, running initialize');
      initialize();
    } else {
      console.log('⏳ Waiting for conditions:', { isLoaded });
    }

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      console.log('🧹 Cleanup: component unmounted');
    };
  }, [user?.id, isLoaded, retryCount]);

  const handleCheckIn = async () => {
    if (!user?.id) {
      console.log('❌ Cannot check in: no user');
      return;
    }

    try {
      console.log('🔄 Fetching updated stats after check-in');
      const stats = await DatabaseService.userStats.getOrCreate(user.id);
      console.log('📊 Received updated stats:', stats);
      setUserStats(stats);
    } catch (err) {
      console.error('❌ Error updating stats:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <SignedIn>
        <div className="space-y-6">
          {/* Stats display */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{userStats.visit_count}</div>
              <div className="text-sm text-gray-600">restaurants visited</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-coral-600 mb-1">{Math.floor(userStats.visit_count / 4)}</div>
              <div className="text-sm text-gray-600">raffle entries</div>
            </div>
          </div>

          {/* Wide check-in button */}
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="w-full py-3 px-4 bg-coral-600 text-white text-lg font-medium rounded-lg hover:bg-coral-700 transition-colors"
          >
            Check In
          </button>

          {/* Full-width map */}
          <div className="w-full h-[400px] bg-white rounded-lg border border-gray-200 overflow-hidden">
            <RestaurantMap />
          </div>

          {/* Bingo card */}
          <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
            <BingoCard onVisitUpdate={handleCheckIn} />
          </div>
        </div>

        <CheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          onCheckIn={handleCheckIn}
        />
      </SignedIn>

      <SignedOut>
        <div className="w-full max-w-3xl mx-auto text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Restaurant Week Bingo!
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Sign in to start playing and earning raffle entries by visiting local restaurants.
          </p>
          <div className="w-full max-w-md mx-auto">
            <SignIn
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full shadow-lg",
                  formButtonPrimary: "bg-coral-600 hover:bg-coral-700"
                }
              }}
            />
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
