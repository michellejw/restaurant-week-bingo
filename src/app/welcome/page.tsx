'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  console.log('🎉 Welcome page loaded:', {
    hasUser: !!user,
    email: user?.email,
    isConfirmed: !!user?.email_confirmed_at
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!user?.id) {
      setError('No user found. Please try logging in again.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('📝 Updating user info:', { id: user.id, name, phone });
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name,
          phone,
        });

      if (updateError) throw updateError;

      console.log('✅ User info updated successfully');
      router.push('/');
    } catch (err) {
      console.error('❌ Error updating user info:', err);
      setError('Failed to update your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Welcome to Restaurant Week Bingo!
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Please provide your contact information so we can notify you if you win the raffle.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-coral-500 focus:outline-none focus:ring-coral-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-coral-500 focus:outline-none focus:ring-coral-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm mt-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-coral-600 hover:bg-coral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Bingo!'}
          </button>
        </form>
      </div>
    </div>
  );
} 