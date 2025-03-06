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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SignedIn>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Week Bingo</h1>
              <p className="text-gray-600">
                Visit restaurants to fill your card and earn raffle entries!
              </p>
            </div>
            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="px-4 py-2 bg-coral-600 text-white rounded-lg hover:bg-coral-700 transition-colors"
            >
              Check In
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Restaurants Visited</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.visit_count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Raffle Entries Earned</p>
                  <p className="text-2xl font-bold text-coral-600">{userStats.raffle_entries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Visit participating restaurants during Restaurant Week</li>
                <li>• Ask your server for the restaurant&apos;s unique code</li>
                <li>• Enter the code to check in and mark your bingo card</li>
                <li>• Earn 1 raffle entry for every 5 restaurants visited</li>
              </ul>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Bingo Card</h2>
              <BingoCard onVisitUpdate={handleCheckIn} />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Restaurant Map</h2>
              <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                <RestaurantMap />
              </div>
            </section>
          </div>
        </div>

        <CheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          onCheckIn={handleCheckIn}
        />
      </SignedIn>

      <SignedOut>
        <div className="max-w-3xl mx-auto text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Restaurant Week Bingo!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sign in to start playing and earning raffle entries by visiting local restaurants.
          </p>
          <SignIn
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full max-w-md mx-auto"
              }
            }}
          />
          <p>Don&apos;t have an account?</p>
        </div>
      </SignedOut>
    </div>
  );
}
