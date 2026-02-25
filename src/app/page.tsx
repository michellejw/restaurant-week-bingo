'use client';

import { useState } from 'react';
import { useUser, SignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import Image from 'next/image';
import BingoCard from '@/components/BingoCard';
import dynamic from 'next/dynamic';
import CheckInModal from '@/components/CheckInModal';
import { RESTAURANT_WEEK_CONFIG, RestaurantWeekUtils } from '@/config/restaurant-week';
import { useUserStats } from '@/hooks/useUserStats';
import { useRestaurants } from '@/hooks/useRestaurants';

// Dynamically import the map component with SSR disabled
const RestaurantMap = dynamic(
  () => import('@/components/RestaurantMap'),
  { ssr: false }
);

export default function Home() {
  const { user } = useUser();
  const { stats: userStats, loading: statsLoading, refresh: refreshStats } = useUserStats();
  const { refresh: refreshRestaurants } = useRestaurants();
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Loading state based on SWR hooks
  const initialLoadComplete = !statsLoading;

  const handleCheckIn = async () => {
    if (!user?.id) {
      return;
    }
    // Refresh both caches after check-in
    await Promise.all([refreshStats(), refreshRestaurants()]);
  };

  const handleRestaurantSelect = (restaurantId: string) => {
    // If empty string is passed, deselect
    if (restaurantId === '') {
      setSelectedRestaurantId(null);
    } else {
      setSelectedRestaurantId(restaurantId);
    }
  };

  const handleRestaurantDeselect = () => {
    setSelectedRestaurantId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-3 pb-6">
      <SignedIn>
        <div className="space-y-6">
          {/* Stats display */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {!initialLoadComplete ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-8 mx-auto rounded"></div>
                ) : (
                  userStats.visit_count
                )}
              </div>
              <div className="text-sm text-gray-600">restaurants visited</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-bold text-coral-600 mb-1">
                {!initialLoadComplete ? (
                  <div className="animate-pulse bg-coral-200 h-8 w-8 mx-auto rounded"></div>
                ) : (
                  userStats.raffle_entries
                )}
              </div>
              <div className="text-sm text-gray-600">raffle entries</div>
            </div>
          </div>

          {/* Wide check-in button */}
          {(() => {
            const isDevMode = RestaurantWeekUtils.isDevelopmentOverrideEnvironment();
            const phase = RestaurantWeekUtils.getPhaseByDateOnly();

            if (isDevMode || phase === 'active') {
              return (
                <button
                  onClick={() => setIsCheckInModalOpen(true)}
                  className="w-full py-3 px-4 bg-coral-600 hover:bg-coral-700 text-white text-lg font-medium rounded-lg transition-colors"
                >
                  Check In at Restaurant
                </button>
              );
            }

            if (phase === 'before_start') {
              return (
                <button
                  onClick={() => setIsCheckInModalOpen(true)}
                  className="w-full py-3 px-4 bg-gray-400 text-white text-lg font-medium rounded-lg cursor-not-allowed"
                >
                  {RESTAURANT_WEEK_CONFIG.messages.title}
                </button>
              );
            }

            return (
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="w-full py-3 px-4 bg-gray-400 text-white text-lg font-medium rounded-lg cursor-not-allowed"
              >
                {RESTAURANT_WEEK_CONFIG.messages.afterEndTitle}
              </button>
            );
          })()}

          {/* Full-width map */}
          <div className="w-full h-[400px] bg-white rounded-lg border border-gray-200 overflow-hidden">
            <RestaurantMap
              onVisitUpdate={handleCheckIn}
              targetRestaurantId={selectedRestaurantId}
              onRestaurantSelect={handleRestaurantSelect}
              onRestaurantDeselect={handleRestaurantDeselect}
            />
          </div>

          {/* Restaurant Specials Button */}
          <div className="flex justify-center">
            <a
              href="https://www.pleasureislandnc.org/restaurant-week-specials.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-coral-50 text-gray-900 font-medium rounded-lg border-2 border-coral-500 hover:border-coral-600 transition-colors shadow-md"
            >
              <svg className="w-5 h-5 text-coral-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              View Restaurant Week Specials
              <svg className="w-4 h-4 text-coral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Bingo card */}
          <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
            <BingoCard
              onVisitUpdate={handleCheckIn}
              onRestaurantSelect={handleRestaurantSelect}
              selectedRestaurantId={selectedRestaurantId}
            />
          </div>
        </div>

        <CheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          onCheckIn={handleCheckIn}
        />
      </SignedIn>

      <SignedOut>
        <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto text-center py-12">
          <Image
            src={RESTAURANT_WEEK_CONFIG.logoFile}
            alt="Restaurant Week Logo"
            width={440}
            height={440}
            className="h-[24rem] md:h-[30rem] w-auto mb-8"
            priority
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Restaurant Week Bingo!
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Sign in to start playing and earning raffle entries by visiting local restaurants.
          </p>
          <div className="flex justify-center w-full max-w-md">
            <SignIn
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full flex justify-center',
                  card: 'w-full max-w-[400px] shadow-lg',
                  formButtonPrimary: 'bg-coral-600 hover:bg-coral-700'
                },
                layout: {
                  socialButtonsPlacement: 'bottom',
                  socialButtonsVariant: 'blockButton'
                }
              }}
            />
          </div>
        </div>
      </SignedOut>
    </div>
  );
}
