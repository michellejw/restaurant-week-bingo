// src/hooks/useSupabaseUser.ts
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = '0da4e8d4-8a5e-4bfa-941c-226c4b9d8ac9';

export function useSupabaseUser() {
  const { user, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const [supabaseId, setSupabaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initializationInProgress, setInitializationInProgress] = useState(false);

  useEffect(() => {
    async function initializeUser() {
      // Prevent concurrent initializations
      if (initializationInProgress) {
        console.log('⏳ Initialization already in progress, skipping...');
        return;
      }

      console.log('🔍 useSupabaseUser initializeUser called with:', {
        hasUser: !!user,
        isSignedIn,
        clerkLoaded,
        currentSupabaseId: supabaseId,
        currentInitialized: initialized,
        initializationInProgress
      });

      if (!user || !isSignedIn) {
        console.log('❌ No user or not signed in, resetting states');
        setSupabaseId(null);
        setInitialized(false);
        setLoading(false);
        return;
      }

      // If already initialized with the correct ID, skip
      const expectedId = uuidv5(user.id, NAMESPACE);
      if (initialized && supabaseId === expectedId) {
        console.log('✅ Already initialized with correct ID, skipping');
        return;
      }

      try {
        setInitializationInProgress(true);
        
        // Generate UUID consistently using v5 and the user's Clerk ID
        const dbId = expectedId;
        console.log('📝 Generated Supabase ID:', dbId);
        
        // Call the initialization API
        console.log('🚀 Calling initialization API...');
        const response = await fetch('/api/user/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('❌ Initialization API failed:', {
            status: response.status,
            statusText: response.statusText
          });
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error('Failed to initialize user');
        }

        const data = await response.json();
        console.log('✅ Initialization API success:', data);

        setSupabaseId(dbId);
        setInitialized(true);
        setError(null);
        console.log('✅ States updated:', { dbId, initialized: true });
      } catch (e) {
        console.error('❌ Error in initializeUser:', e);
        setError(e instanceof Error ? e : new Error('Failed to initialize user'));
        setInitialized(false);
      } finally {
        setLoading(false);
        setInitializationInProgress(false);
      }
    }

    if (clerkLoaded) {
      console.log('🔄 Clerk loaded, calling initializeUser');
      initializeUser();
    } else {
      console.log('⏳ Waiting for Clerk to load...');
    }
  }, [user?.id, clerkLoaded, isSignedIn]); // Only depend on user.id instead of entire user object

  console.log('📊 useSupabaseUser current state:', {
    supabaseId,
    loading: loading || !clerkLoaded,
    initialized,
    hasError: !!error,
    initializationInProgress
  });

  return {
    supabaseId,
    loading: loading || !clerkLoaded,
    initialized,
    error
  };
}