'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DatabaseService } from '@/lib/services/database';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn?: () => void;
}

type DatabaseError = {
  message?: string;
  code?: string;
};

export default function CheckInModal({ isOpen, onClose, onCheckIn }: CheckInModalProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckIn = useCallback(async (checkInCode: string) => {
    setLoading(true);
    setMessage('');

    try {
      if (!user) {
        setMessage('Please log in to check in.');
        return;
      }

      if (!checkInCode.trim()) {
        setMessage('Please enter a restaurant code.');
        return;
      }

      try {
        const restaurant = await DatabaseService.restaurants.getByCode(checkInCode);
        
        const alreadyVisited = await DatabaseService.visits.checkExists(user.id, restaurant.id);
        if (alreadyVisited) {
          setMessage('You have already checked in at this restaurant!');
          return;
        }

        await DatabaseService.visits.create(user.id, restaurant.id);
        setMessage(`Check-in successful at ${restaurant.name}!`);
        setCode('');
        onCheckIn?.();
        
        // Close modal after successful check-in
        setTimeout(() => {
          onClose();
          setMessage('');
        }, 2000);
      } catch (error) {
        const dbError = error as DatabaseError;
        if (dbError.message?.includes('No data returned') || dbError.code === 'PGRST116') {
          setMessage('Invalid restaurant code. Please check the code and try again.');
        } else if (dbError.code === '23505') { // Unique constraint violation
          setMessage('You have already checked in at this restaurant!');
        } else if (dbError.code === '42501') { // RLS policy violation
          setMessage('You do not have permission to check in. Please log in again.');
        } else if (dbError.code?.startsWith('23')) { // Other database constraint errors
          setMessage('Unable to check in. Please try again later.');
        } else {
          console.error('Unexpected error during check-in:', dbError);
          setMessage('An error occurred. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, onCheckIn, onClose]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Check In</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input w-full"
              placeholder="Enter code"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Checking in...' : 'Submit'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm text-center ${
            message.includes('successful') ? 'text-coral-600' : 'text-red-600'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
} 