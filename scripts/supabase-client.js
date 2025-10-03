/**
 * Node.js compatible Supabase client
 * Used by import/export scripts
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || // Preferred for server-side operations
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // fallback for legacy env var

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a Supabase client for database operations
const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false, // Disable auth persistence since we're using Clerk
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

// Helper function to check and throw database errors
function checkError(response) {
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('No data returned from query');
  }
  return response.data;
}

module.exports = { supabase, checkError };