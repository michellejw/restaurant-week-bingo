import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // fallback for legacy env var

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)')
}

// Create a Supabase client for database operations with Clerk auth
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false, // Disable auth persistence since we're using Clerk
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Helper function to check and throw database errors
export function checkError<T>(response: { data: T | null; error: Error | null }): T {
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('No data returned from query');
  }
  return response.data;
}
