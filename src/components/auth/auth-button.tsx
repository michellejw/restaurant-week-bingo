'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export function AuthButton() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <button className="px-4 py-2 bg-gray-200 rounded-md">Loading...</button>;
  }

  if (user) {
    const logoutUrl = `/api/auth/logout?returnTo=${encodeURIComponent(
      window.location.origin
    )}&federated`;

    return (
      <a
        href={logoutUrl}
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      >
        Logout
      </a>
    );
  }

  return (
    <a
      href="/api/auth/login"
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
    >
      Login
    </a>
  );
} 