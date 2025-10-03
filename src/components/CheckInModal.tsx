'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import { RESTAURANT_WEEK_CONFIG, RestaurantWeekUtils } from '@/config/restaurant-week';

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

  // Check if we're in dev environment
  const isDevEnvironment = typeof window !== 'undefined' && 
    (process.env.NODE_ENV === 'development' || 
     (process.env.NEXT_PUBLIC_DEV_HOSTNAME && window.location.hostname === process.env.NEXT_PUBLIC_DEV_HOSTNAME));

  // Check if Restaurant Week is active
  const isRestaurantWeekActive = RestaurantWeekUtils.isActive();
  const daysUntilStart = RestaurantWeekUtils.getDaysUntilStart();
  const formattedStartDate = RestaurantWeekUtils.getFormattedStartDate();
  const statusInfo = RestaurantWeekUtils.getStatusInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !code.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get all restaurants to find matching code
      const restaurants = await DatabaseService.restaurants.getAll();
      const restaurant = restaurants.find(r => r.code.toLowerCase() === code.trim().toLowerCase());
      
      if (!restaurant) {
        setError('Invalid code. Please check the code and try again.');
        setLoading(false);
        return;
      }

      // Check if already visited
      const alreadyVisited = await DatabaseService.visits.checkExists(user.id, restaurant.id);
      if (alreadyVisited) {
        setError(`You've already checked in at ${restaurant.name}!`);
        setLoading(false);
        return;
      }

      // Create the visit
      await DatabaseService.visits.create(user.id, restaurant.id);
      
      setSuccess(`Successfully checked in at ${restaurant.name}!`);
      
      // Call the onCheckIn callback to refresh parent state
      if (onCheckIn) {
        onCheckIn();
      }
      
    } catch (error) {
      console.error('Check-in error:', error);
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

  // Determine what modal to show based on environment and Restaurant Week status
  if (isDevEnvironment || isRestaurantWeekActive) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {(isDevEnvironment || isRestaurantWeekActive) ? 'Check In to Restaurant' : RESTAURANT_WEEK_CONFIG.messages.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {(isDevEnvironment || isRestaurantWeekActive) 
              ? RESTAURANT_WEEK_CONFIG.messages.duringEvent
              : `${RESTAURANT_WEEK_CONFIG.messages.beforeStart} ${daysUntilStart > 0 ? `Only ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'} to go!` : ''}`
            }
          </p>
          
          {/* Testing Override Banner */}
          {isRestaurantWeekActive && !statusInfo.dateBasedActive && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">
                    {statusInfo.isDevelopment ? '🧪 Testing Mode Active' : '🚨 Production Override Active'}
                  </p>
                  <p className="text-yellow-700">
                    {statusInfo.isDevelopment 
                      ? `Check-ins enabled early for development (Restaurant Week starts ${formattedStartDate})`
                      : 'Check-ins manually enabled in production before Restaurant Week start date'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {success ? (
            // Success state - show celebration message
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
          ) : !(isDevEnvironment || isRestaurantWeekActive) ? (
            // Restaurant Week hasn't started yet - show countdown
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-coral-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="bg-coral-50 p-4 rounded-lg">
                <p className="font-medium text-coral-900 mb-2">Check-ins start on:</p>
                <p className="text-lg text-coral-800">{formattedStartDate}</p>
                {daysUntilStart > 0 && (
                  <p className="text-sm text-coral-600 mt-2">In {daysUntilStart} day{daysUntilStart === 1 ? '' : 's'}!</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Got It
              </button>
            </div>
          ) : (
            // Code entry state - show form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                  placeholder="Enter code..."
                  disabled={loading}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-coral-600 rounded-md hover:bg-coral-700 disabled:opacity-50"
                  disabled={loading || !code.trim()}
                >
                  {loading ? 'Checking In...' : 'Check In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Show coming soon modal if Restaurant Week hasn't started yet
  if (daysUntilStart > 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{RESTAURANT_WEEK_CONFIG.messages.title}</h2>
          <p className="text-gray-600 mb-6">
            {RESTAURANT_WEEK_CONFIG.messages.beforeStart}
          </p>
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-coral-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="bg-coral-50 p-4 rounded-lg">
              <p className="font-medium text-coral-900 mb-2">Check-ins start on:</p>
              <p className="text-lg text-coral-800">{formattedStartDate}</p>
              <p className="text-sm text-coral-600 mt-2">In {daysUntilStart} day{daysUntilStart === 1 ? '' : 's'}!</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Restaurant Week is over - show thanks message
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thanks For A Great Restaurant Week!</h2>
        <p className="text-gray-600 mb-6">
          We hope you enjoyed discovering Pleasure Island&apos;s amazing restaurants! While check-ins are now closed, 
          we encourage you to keep supporting our local restaurants throughout the year. See you next fall for 
          more delicious adventures!
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 