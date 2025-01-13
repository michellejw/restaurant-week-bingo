'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Restaurant } from '@/types/restaurant';

export default function VisitPage({ params }: { params: { restaurantId: string } }) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        if (!user) {
          // If user is not logged in, redirect to login
          window.location.href = `/api/auth/login?returnTo=/visit/${params.restaurantId}`;
          return;
        }

        const response = await fetch('/api/visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantId: params.restaurantId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to record visit');
        }

        const data = await response.json();
        setRestaurant(data.restaurant);
        setStatus('success');

        // Redirect to home page after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } catch (error) {
        console.error('Error recording visit:', error);
        setError(error instanceof Error ? error.message : 'Failed to record visit');
        setStatus('error');
      }
    };

    if (!userLoading) {
      recordVisit();
    }
  }, [params.restaurantId, user, userLoading, router]);

  if (userLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Recording Your Visit</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-600">{error || 'Something went wrong'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-600">Visit Recorded!</h1>
        <p className="text-gray-600">
          Thanks for visiting {restaurant?.name}! Your bingo card has been updated.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Redirecting you back to your bingo card...
        </p>
      </div>
    </div>
  );
} 