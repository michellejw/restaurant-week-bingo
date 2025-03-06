import { supabase, adminSupabase, checkError } from '../supabase';
import type { Database } from '@/types/supabase';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

type UserProfile = Database['public']['Tables']['users']['Row'];
type UserStats = Database['public']['Tables']['user_stats']['Row'];

export const UserService = {
  async createOrUpdateUser(clerkId: string, supabaseId: string, email: string, name?: string | null): Promise<UserProfile> {
    const response = await adminSupabase
      .from('users')
      .upsert({
        id: supabaseId,
        email,
        name,
      })
      .select()
      .single();
    
    return checkError(response);
  },

  async initializeUserStats(supabaseId: string): Promise<UserStats> {
    const response = await adminSupabase
      .from('user_stats')
      .upsert({
        user_id: supabaseId,
        visit_count: 0,
        raffle_entries: 0,
      })
      .select()
      .single();
    
    return checkError(response);
  },

  async getProfile(supabaseId: string): Promise<UserProfile> {
    const response = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', supabaseId)
      .single();
    
    return checkError(response);
  },

  async updateProfile(supabaseId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await adminSupabase
      .from('users')
      .update(updates)
      .eq('id', supabaseId)
      .select()
      .single();
    
    return checkError(response);
  },
}; 