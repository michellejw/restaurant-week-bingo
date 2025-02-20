'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Settings() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();

  console.log('🎯 Settings page rendered:', {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    isLoading,
    isLoggedIn
  });

  useEffect(() => {
    // If auth is still loading, wait
    if (isLoading) return;

    // If auth is done loading and we have no user, redirect
    if (!isLoading && !isLoggedIn) {
      console.log('❌ No user found in settings, redirecting to home');
      router.push('/');
      return;
    }

    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        console.log('🔍 Fetching user data for settings');
        const { data, error } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Error fetching user data:', error);
          setMessage('Error loading user data. Please try again.');
          return;
        }

        if (data) {
          console.log('✅ User data fetched:', { name: data.name, phone: data.phone });
          setName(data.name || '');
          setPhone(data.phone || '');
        }
      } catch (error) {
        console.error('❌ Error in settings page:', error);
        setMessage('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, isLoading, isLoggedIn, router]);

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('📝 Updating user settings:', { name, phone });
      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone
        })
        .eq('id', user?.id);

      if (error) throw error;

      console.log('✅ Settings updated successfully');
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      setMessage('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    console.log('❌ No user in settings component, rendering null');
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20 p-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Account Settings
        </h1>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="input bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="Enter your phone number"
              />
            </div>
            <div className="flex flex-col gap-4">
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
                    Processing...
                  </span>
                ) : (
                  'Update Profile'
                )}
              </button>
              <Link
                href="/reset-password"
                className="btn btn-secondary w-full text-center"
              >
                Reset Password
              </Link>
            </div>
            {message && (
              <p className={`mt-2 text-sm text-center ${
                message.includes('successfully') ? 'text-green-600' : 'text-coral-600'
              } animate-fade-in`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}