'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

export default function ProfileBanner() {
  const { user } = useUser();
  const { loading: supabaseLoading } = useSupabaseUser();

  // Only show banner if user is logged in and profile is incomplete
  if (!user || supabaseLoading || (user.firstName && user.phoneNumbers.length > 0)) {
    return null;
  }

  return (
    <div className="bg-coral-50 border-b border-coral-100">
      <div className="max-w-7xl mx-auto py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium text-coral-700">
              Please complete your profile so we can contact you if you win!
            </p>
          </div>
          <Link
            href="/settings"
            className="ml-4 px-4 py-1.5 text-sm font-medium text-coral-600 bg-white rounded-lg border border-coral-200 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    </div>
  );
} 