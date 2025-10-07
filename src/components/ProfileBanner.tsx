'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DatabaseService } from '@/lib/services/database';

export default function ProfileBanner() {
  const { user } = useUser();
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();

  const checkContactInfo = async () => {
    if (!user) return;
    try {
      const data = await DatabaseService.users.getContactInfo(user.id);
      // Show banner if no data or no phone number
      setShowBanner(!data || !data.phone);
    } catch (error) {
      console.error('Error checking contact info:', error);
      // On error, show banner to be safe
      setShowBanner(true);
    }
  };

  // Check contact info when user changes or when navigating back from /my-info
  useEffect(() => {
    checkContactInfo();
  }, [user, pathname]);

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