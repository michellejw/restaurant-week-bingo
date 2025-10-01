'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';

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
     window.location.hostname.includes('vercel.app'));

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

  if (isDevEnvironment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Check In to Restaurant</h2>
          <p className="text-gray-600 mb-4">
            Enter the restaurant&apos;s unique code to check in and earn progress toward raffle entries!
          </p>
          
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

  // Production modal (Restaurant Week is over)
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