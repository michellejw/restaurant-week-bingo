'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DatabaseService } from '@/lib/services/database';

interface CheckInFormProps {
  onCheckIn?: () => void;
}

export default function CheckInForm({ onCheckIn }: CheckInFormProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!user) {
        setMessage('Please log in to check in.');
        return;
      }

      // Find restaurant by code
      try {
        const restaurant = await DatabaseService.restaurants.getByCode(code);
        
        // Check if already visited
        const alreadyVisited = await DatabaseService.visits.checkExists(user.id, restaurant.id);
        if (alreadyVisited) {
          setMessage('You have already checked in at this restaurant!');
          return;
        }

        // Record the visit
        await DatabaseService.visits.create(user.id, restaurant.id);

        setMessage(`Check-in successful at ${restaurant.name}!`);
        setCode('');
        onCheckIn?.();
      } catch (error: any) {
        if (error.message?.includes('No data returned')) {
          setMessage('Invalid restaurant code. Please try again.');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Restaurant Code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="input"
            placeholder="Enter code"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Checking in...
            </span>
          ) : (
            'Check In'
          )}
        </button>
        {message && (
          <p className={`mt-2 text-sm text-center animate-fade-in ${
            message.includes('successful') ? 'text-coral-600' : 'text-red-600'
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
} 