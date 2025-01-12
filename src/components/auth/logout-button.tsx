'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export function LogoutButton() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <a
      href="/api/auth/logout"
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
    >
      Logout
    </a>
  );
} 