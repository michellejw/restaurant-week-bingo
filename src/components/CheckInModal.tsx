'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn?: () => void;
}

export default function CheckInModal({ isOpen, onClose, onCheckIn }: CheckInModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isLoaded: clerkLoaded } = useUser();
  const { supabaseId, loading: supabaseLoading } = useSupabaseUser();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseId || !code) return;

    setLoading(true);
    setError(null);

    try {
      // Get restaurant by code
      const restaurant = await DatabaseService.restaurants.getByCode(code);
      
      // Check if already visited
      const alreadyVisited = await DatabaseService.visits.checkExists(supabaseId, restaurant.id);
      if (alreadyVisited) {
        setError('You have already checked in at this restaurant');
        return;
      }

      // Create visit
      await DatabaseService.visits.create(supabaseId, restaurant.id);
      
      // Close modal and trigger refresh
      onClose();
      onCheckIn?.();
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Invalid restaurant code');
    } finally {
      setLoading(false);
    }
  }, [code, supabaseId, onClose, onCheckIn]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Check In</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-coral-500 focus:border-coral-500"
              placeholder="Enter code"
              disabled={loading || !clerkLoaded || supabaseLoading}
            />
          </div>
          {error && (
            <div className="mb-4 text-sm text-red-600">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-coral-600 rounded-md hover:bg-coral-700 disabled:opacity-50"
              disabled={loading || !code || !clerkLoaded || supabaseLoading}
            >
              {loading ? 'Checking in...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 