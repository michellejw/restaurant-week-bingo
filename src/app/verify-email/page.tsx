'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔍 Verify Email Page - User state:', {
      hasUser: !!user,
      email: user?.email,
      isConfirmed: !!user?.email_confirmed_at,
      confirmedAt: user?.email_confirmed_at
    });

    // If user is already confirmed, redirect to welcome or home
    if (user?.email_confirmed_at) {
      console.log('✅ Email already verified, redirecting');
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Check Your Email
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            We've sent a verification link to{' '}
            <span className="font-medium">{user?.email}</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please click the link in your email to verify your account. You may need to check your spam folder.
          </p>
          <p className="mt-6 text-sm text-gray-500">
            After verifying your email, you can return to this page and continue to the application.
          </p>
        </div>
      </div>
    </div>
  );
} 