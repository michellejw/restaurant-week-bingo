"use client"
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

export default function UserInitializer() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { supabaseId, loading: supabaseLoading } = useSupabaseUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    async function initializeUser() {
      if (!clerkUser || isInitializing || !isSignedIn || isInitialized) return;

      try {
        setIsInitializing(true);
        
        // Call the initialization API
        const response = await fetch('/api/user/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to initialize user');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsInitializing(false);
      }
    }

    // Only run initialization if Clerk is fully loaded and user is signed in
    if (clerkLoaded && isSignedIn && !isInitializing) {
      initializeUser();
    }
  }, [clerkUser, clerkLoaded, isSignedIn, isInitializing, isInitialized]);

  return null;
}