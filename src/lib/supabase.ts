import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a Supabase client for database operations only
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // Disable auth persistence since we're using Clerk
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Helper function to check and throw database errors
export function checkError<T>(
  result: { error: any; data: T }
): T {
  if (result.error) {
    throw result.error
  }
  return result.data
} 