'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CheckInFormProps {
  onCheckIn?: () => void;
}

export default function CheckInForm({ onCheckIn }: CheckInFormProps) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setMessage('Please log in to check in.');
        return;
      }

      // Find restaurant by code
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('code', code.toUpperCase())
        .single();

      if (restaurantError || !restaurant) {
        setMessage('Invalid restaurant code. Please try again.');
        return;
      }

      // Check if already visited
      const { data: existingVisit } = await supabase
        .from('visits')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurant.id)
        .single();

      if (existingVisit) {
        setMessage('You have already checked in at this restaurant!');
        return;
      }

      // Record the visit
      const { error: insertError } = await supabase
        .from('visits')
        .insert([
          {
            user_id: user.id,
            restaurant_id: restaurant.id,
          }
        ]);

      if (insertError) throw insertError;

      setMessage(`Check-in successful at ${restaurant.name}!`);
      setCode('');
      onCheckIn?.();
    } catch (error) {
      console.error('Error during check-in:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Restaurant Code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? 'Checking in...' : 'Check In'}
        </button>
        {message && (
          <p className={`mt-2 text-sm text-center ${
            message.includes('successful') ? 'text-green-600' : 'text-red-600'
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
} 