"use client"
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';
import { UserService } from '@/lib/services/user-service';

export function UserInitializer() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const initializeUser = async () => {
      try {
        // First ensure user exists in our database
        await UserService.ensureUserExists(user.id);
        // Then initialize their stats
        await DatabaseService.userStats.getOrCreate(user.id);
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, [isLoaded, user]);

  return null;
}