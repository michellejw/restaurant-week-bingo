"use client"
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { DatabaseService } from '@/lib/services/database';

export function UserInitializer() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const initializeUserStats = async () => {
      try {
        await DatabaseService.userStats.getOrCreate(user.id);
      } catch (error) {
        console.error('Error initializing user stats:', error);
      }
    };

    initializeUserStats();
  }, [isLoaded, user]);

  return null;
}