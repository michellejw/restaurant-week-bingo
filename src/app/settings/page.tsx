'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

// Remove formatting from phone number
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
  const { user, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();
  const initialValuesSet = useRef(false);

  useEffect(() => {
    if (clerkLoaded && !user) {
      router.push('/');
      return;
    }

    // Only set initial values once
    if (user && !initialValuesSet.current) {
      setName(user.fullName || '');
      // Format phone number if it exists in user metadata
      const userPhone = user.unsafeMetadata.phone as string;
      setPhone(userPhone ? formatPhoneNumber(userPhone) : '');
      initialValuesSet.current = true;
    }
  }, [user, clerkLoaded, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    if (formattedNumber.length <= 14) { // (XXX) XXX-XXXX = 14 chars
      setPhone(formattedNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage('');

    // Validate phone number if provided
    if (phone && !isValidPhoneNumber(phone)) {
      setMessage('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      // Update user metadata in Clerk
      await user.update({
        firstName: name.split(' ')[0] || undefined,
        lastName: name.split(' ').slice(1).join(' ') || undefined,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          phone: phone ? unformatPhoneNumber(phone) : null
        }
      });

      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!clerkLoaded || !user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-coral-500 focus:ring-coral-500"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={handlePhoneChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-coral-500 focus:ring-coral-500"
            placeholder="(XXX) XXX-XXXX"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            We&apos;ll only use this to contact you if you win a prize!
          </p>
        </div>

        {message && (
          <div className={`text-sm ${message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 text-sm font-medium text-white bg-coral-600 rounded-md hover:bg-coral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <p className="text-gray-600">
        You&apos;ll be signed out and won&apos;t be able to participate in Restaurant Week Bingo.
      </p>
      <p className="text-gray-600">
        We&apos;ll miss you! You&apos;ll need to create a new account to participate again.
      </p>
    </div>
  );
} 