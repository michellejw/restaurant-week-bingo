'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, signOutAndClear, attemptAutoReLogin } from './supabase';
import type { User } from '@supabase/supabase-js';

type UserProfile = {
  name: string | null;
  phone: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isLoggedIn: false,
  signOut: async () => {},
  refreshSession: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Session expired, try auto re-login
        const { data } = await attemptAutoReLogin();
        setUser(data?.user ?? null);
      } else {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await refreshSession();
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('_persist'); // Clean up persisted credentials on sign out
        router.push('/');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch profile when user changes
  useEffect(() => {
    refreshProfile();
  }, [user, refreshProfile]);

  const signOut = async () => {
    await signOutAndClear();
    setUser(null);
    setProfile(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isLoggedIn: !!user,
        signOut,
        refreshSession,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 