"use client"
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';

export function UserInitializer() {
  const { user, isLoaded } = useUser();

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

        // Initialize user and user stats
        await DatabaseService.users.createIfNotExists(user.id, primaryEmail);
        await DatabaseService.userStats.getOrCreate(user.id);
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [isLoaded, user]);

  return null;
}