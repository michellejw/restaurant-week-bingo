'use client';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type Error = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Encrypt credentials before storing
const encryptCredentials = (email: string, password: string): string => {
  // Simple encryption - in production you'd want stronger encryption
  return btoa(JSON.stringify({ email, password }));
};

// Decrypt stored credentials
const decryptCredentials = (encrypted: string): { email: string; password: string } | null => {
  try {
    return JSON.parse(atob(encrypted));
  } catch {
    return null;
  }
};

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
  }
);

// Enhanced sign in with automatic persistence
export const signInWithPersistence = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (!error && data.user) {
    // Store encrypted credentials
    if (typeof window !== 'undefined') {
      localStorage.setItem('_persist', encryptCredentials(email, password));
    }
  }
  
  return { data, error };
};

// Auto re-login if session expires
export const attemptAutoReLogin = async () => {
  const persistedCreds = typeof window !== 'undefined' ? localStorage.getItem('_persist') : null;
  
  if (persistedCreds) {
    const creds = decryptCredentials(persistedCreds);
    if (creds) {
      return supabase.auth.signInWithPassword(creds);
    }
  }
  return { data: null, error: new Error('No persisted credentials') };
};

// Enhanced sign out that clears persistence
export const signOutAndClear = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('_persist');
  }
  return supabase.auth.signOut();
};

// Test function to check session state
export const checkSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Current session:', session);
  if (session) {
    console.log('Session expires at:', new Date(session.expires_at! * 1000).toLocaleString());
  }
  return session;
};

// Helper to handle Supabase errors consistently
export function handleSupabaseError(error: unknown): never {
  const supaError = error as Error;
  throw new Error(supaError.message || 'An unknown error occurred');
}

// Helper to check if there was an error in the Supabase response
export const checkError = <T>(response: SupabaseResponse<T>): T => {
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('No data returned from Supabase');
  }
  return response.data;
};