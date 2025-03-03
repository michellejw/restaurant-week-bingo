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
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

// Simple sign in
export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
};

// Simple sign up
export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({
    email,
    password,
  });
};

// Simple sign out
export const signOut = async () => {
  return supabase.auth.signOut();
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