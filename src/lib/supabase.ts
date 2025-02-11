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

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
          }
          return null;
        },
        setItem: (key, value) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
          }
        },
        removeItem: (key) => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
        },
      },
    },
  }
);

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