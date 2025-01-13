'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { AuthButton } from '../auth/auth-button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function Navbar() {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (auth0User?.email) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('isAdmin')
            .eq('email', auth0User.email)
            .single();

          if (error) {
            console.error('Error fetching admin status:', error);
            return;
          }

          setIsAdmin(data?.isAdmin || false);
          console.log('Admin status:', data?.isAdmin);
        } catch (err) {
          console.error('Error checking admin status:', err);
        }
      }
    }

    checkAdminStatus();
  }, [auth0User?.email]);

  if (auth0Loading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">Restaurant Week Bingo</h1>
            </div>
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Restaurant Week Bingo</h1>
          </div>
          <div className="flex items-center space-x-4">
            {auth0User && (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <span className="text-gray-600">
                  Welcome, {auth0User.name || auth0User.email}!
                </span>
                <AuthButton />
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 