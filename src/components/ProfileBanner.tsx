'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function ProfileBanner() {
  const { user } = useUser();
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();

  const checkContactInfo = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/me/contact');
      if (!response.ok) {
        throw new Error('Failed to load contact info');
      }

      const data = await response.json();
      setShowBanner(!data || !data.phone);
    } catch (error) {
      console.error('Error checking contact info:', error);
      setShowBanner(true);
    }
  }, [user]);

  // Check contact info when user changes or when navigating back from /my-info
  useEffect(() => {
    checkContactInfo();
  }, [checkContactInfo, pathname]);

  if (!user || !showBanner) {
    return null;
  }

  return (
    <div className="bg-coral-50 border-b border-coral-100">
      <div className="max-w-7xl mx-auto py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium text-coral-700">
              Please add your contact info so we can let you know if you win!
            </p>
          </div>
          <Link
            href="/my-info"
            className="ml-4 px-4 py-1.5 text-sm font-medium text-coral-600 bg-white rounded-lg border border-coral-200 hover:bg-coral-50 hover:text-coral-700 hover:border-coral-300 transition-colors"
          >
            Add Contact Info
          </Link>
        </div>
      </div>
    </div>
  );
} 
