"use client"
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { setSentryUserContext } from '@/lib/sentry/user-context';

export function UserInitializer() {
  const { user, isLoaded } = useUser();

  // Set Sentry user context when auth state changes
  useEffect(() => {
    if (!isLoaded) return;

    // Set or clear Sentry user context (only user ID, no PII)
    setSentryUserContext(user?.id ?? null);
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const initializeUser = async () => {
      try {
        // Get primary email from Clerk user
        const primaryEmail = user.primaryEmailAddress?.emailAddress;

        if (!primaryEmail) {
          console.warn('No primary email found for user:', user.id);
          return;
        }

        const response = await fetch('/api/me/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: primaryEmail }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize user');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [isLoaded, user]);

  return null;
}
