'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { AuthButton } from '../auth/auth-button';
import Link from 'next/link';

export default function Navbar() {
  const { user, isLoading } = useUser();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">Restaurant Week Bingo</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user && !isLoading && (
              <>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <span className="text-gray-600">
                  Welcome, {user.name || user.email}!
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