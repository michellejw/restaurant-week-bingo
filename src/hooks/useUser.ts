import { useEffect, useState } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { UserService } from '@/lib/services/user-service';

export function useUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!clerkLoaded || !clerkUser) {
      setLoading(false);
      return;
    }

    const initializeUser = async () => {
      try {
        await UserService.ensureUserExists(clerkUser.id);
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [clerkUser, clerkLoaded]);

  return {
    user: clerkUser,
    isLoaded: clerkLoaded && !loading,
    initialized,
  };
} 