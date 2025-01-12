'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export default function Home() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-8">
          Welcome to Restaurant Week Bingo!
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Join us in celebrating local restaurants! Login to start playing and win exciting prizes.
        </p>
        <a
          href="/api/auth/login"
          className="px-8 py-3 bg-blue-500 text-white text-lg font-semibold rounded-md hover:bg-blue-600 transition-colors"
        >
          Login to Play
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
          <div>
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative overflow-hidden rounded-full py-1.5 px-4 text-sm leading-6 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                <span className="text-gray-600">
                  Restaurant Week is here! 🎉
                </span>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Support Local and Win Prizes!
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Visit local restaurants, scan QR codes, and win prizes! Join the fun during Pleasure Island Restaurant Week.
              </p>
              {/* Add your authenticated user content here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
