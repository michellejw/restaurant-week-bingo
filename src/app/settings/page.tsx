'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

// Remove formatting to store in database
const unformatPhoneNumber = (value: string) => value.replace(/\D/g, '');

// Validate phone number
const isValidPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.length === 10;
};

export default function Settings() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const initialValuesSet = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      router.push('/');
      return;
    }

    // Only set initial values once
    if (profile && !initialValuesSet.current) {
      setName(profile.name || '');
      // Format phone number from database
      setPhone(profile.phone ? formatPhoneNumber(profile.phone) : '');
      initialValuesSet.current = true;
    }
  }, [user, profile, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    if (formattedNumber.length <= 14) { // (XXX) XXX-XXXX = 14 chars
      setPhone(formattedNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate phone number if provided
    if (phone && !isValidPhoneNumber(phone)) {
      setMessage('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone: phone ? unformatPhoneNumber(phone) : null
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Refresh the profile in the context
      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20 p-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
          Account Settings
        </h1>
        <div className="text-center mb-8 max-w-xl mx-auto">
          <p className="text-gray-600 mb-3">
            Thank you for supporting our local restaurants and bars during Restaurant Week! Your participation helps make our community even more vibrant.
          </p>
          <p className="text-gray-600">
            Please make sure to provide your contact information below so we can reach you if you win one of our exciting prizes. You can update these details anytime!
          </p>
        </div>
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
                onChange={handlePhoneChange}
                className="input"
                placeholder="(XXX) XXX-XXXX"
                pattern="\(\d{3}\) \d{3}-\d{4}"
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