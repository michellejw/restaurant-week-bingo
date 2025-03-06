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
        // Initialize user stats if they don't exist
        await DatabaseService.userStats.getOrCreate(user.id);
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [isLoaded, user]);

  return null;
}