'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export default function ProfileBanner() {
  const { user } = useUser();

  // Only show banner if user is logged in and has no phone number
  if (!user || user.phoneNumbers.length > 0) {
    return null;
  }

  return (
    <div className="bg-coral-50 border-b border-coral-100">
      <div className="max-w-7xl mx-auto py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium text-coral-700">
              Please add your info so we can contact you if you win!
            </p>
          </div>
          <Link
            href="/my-info"
            className="ml-4 px-4 py-1.5 text-sm font-medium text-coral-600 bg-white rounded-lg border border-coral-200 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300 transition-colors"
          >
            Add Phone Number
          </Link>
        </div>
      </div>
    </div>
  );
} 