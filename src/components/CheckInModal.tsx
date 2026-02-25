'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { mutate } from 'swr';
import { RESTAURANT_WEEK_CONFIG, RestaurantWeekUtils } from '@/config/restaurant-week';
import { CACHE_KEYS } from '@/lib/swr/config';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn?: () => void;
}

export default function CheckInModal({ isOpen, onClose, onCheckIn }: CheckInModalProps) {
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const isDevEnvironment = typeof window !== 'undefined' &&
    (process.env.NODE_ENV === 'development' ||
      (process.env.NEXT_PUBLIC_DEV_HOSTNAME && window.location.hostname === process.env.NEXT_PUBLIC_DEV_HOSTNAME));

  const isRestaurantWeekActive = RestaurantWeekUtils.isActive();
  const phaseByDateOnly = RestaurantWeekUtils.getPhaseByDateOnly();
  const daysUntilStart = RestaurantWeekUtils.getDaysUntilStart();
  const formattedStartDate = RestaurantWeekUtils.getFormattedStartDate();
  const statusInfo = RestaurantWeekUtils.getStatusInfo();

  const canSubmitCheckIn = isDevEnvironment || isRestaurantWeekActive;
  const isBeforeStart = phaseByDateOnly === 'before_start';

  const modalTitle = canSubmitCheckIn
    ? 'Check In to Restaurant'
    : isBeforeStart
      ? RESTAURANT_WEEK_CONFIG.messages.title
      : RESTAURANT_WEEK_CONFIG.messages.afterEndTitle;

  const modalDescription = canSubmitCheckIn
    ? RESTAURANT_WEEK_CONFIG.messages.duringEvent
    : isBeforeStart
      ? `${RESTAURANT_WEEK_CONFIG.messages.beforeStart} ${daysUntilStart > 0 ? `Only ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'} to go!` : ''}`
      : RESTAURANT_WEEK_CONFIG.messages.afterEnd;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitCheckIn) {
      setError(modalDescription);
      return;
    }

    if (!user?.id || !code.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully checked in at ${data.restaurant}!`);

        if (user?.id) {
          await Promise.all([
            mutate(CACHE_KEYS.userStats(user.id)),
            mutate(CACHE_KEYS.restaurantsWithVisits(user.id)),
          ]);
        }

        if (onCheckIn) {
          onCheckIn();
        }
      } else if (response.status === 401) {
        setError('Please sign in to check in.');
      } else if (response.status === 429) {
        setError(data.error || 'Too many attempts. Please wait a moment.');
      } else if (response.status === 409) {
        setError(data.error || `You've already checked in at this restaurant!`);
      } else {
        setError(data.error || 'Invalid code. Please check and try again.');
      }
    } catch (submitError) {
      console.error('Check-in error:', submitError);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{modalTitle}</h2>
        <p className="text-gray-600 mb-4">{modalDescription}</p>

        {canSubmitCheckIn && isRestaurantWeekActive && !statusInfo.dateBasedActive && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <p className="text-yellow-800 font-medium">
                  {statusInfo.isDevelopment ? 'Testing Mode Active' : 'Production Override Active'}
                </p>
                <p className="text-yellow-700">
                  {statusInfo.isDevelopment
                    ? `Check-ins enabled early for development (Restaurant Week starts ${formattedStartDate})`
                    : 'Check-ins manually enabled in production before Restaurant Week start date'}
                </p>
              </div>
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-lg font-medium text-green-800 bg-green-50 p-3 rounded">
              {success}
            </div>
            <p className="text-gray-600 text-sm">
              Great job! Your bingo card and map have been updated with your visit.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Continue Playing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!canSubmitCheckIn && (
              <div className="text-sm text-gray-700 bg-gray-100 p-3 rounded-md border border-gray-200">
                Check-ins are currently closed. You can still log in now and be ready when Restaurant Week starts.
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder={canSubmitCheckIn ? 'Enter code...' : 'Check-ins are currently closed'}
                disabled={loading || !canSubmitCheckIn}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                {canSubmitCheckIn ? 'Cancel' : 'Close'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-coral-600 rounded-md hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !code.trim() || !canSubmitCheckIn}
              >
                {loading ? 'Checking In...' : canSubmitCheckIn ? 'Check In' : 'Check-ins Closed'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
