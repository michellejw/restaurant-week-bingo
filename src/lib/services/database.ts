import { supabase, checkError } from '../supabase';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type Restaurant = Tables['restaurants']['Row'];
type Visit = Tables['visits']['Row'];
type UserStats = Tables['user_stats']['Row'];
type Sponsor = Tables['sponsors']['Row'];

type VisitWithRestaurant = Visit & {
  restaurants: Restaurant;
};

export const DatabaseService = {
  restaurants: {
    async getAll(): Promise<Restaurant[]> {
      const response = await supabase
        .from('restaurants')
        .select('*');
      return checkError(response) as Restaurant[];
    },

    async getByCode(code: string): Promise<Restaurant> {
      const response = await supabase
        .from('restaurants')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      return checkError(response) as Restaurant;
    },
  },

  sponsors: {
    async getAll(): Promise<Sponsor[]> {
      const response = await supabase
        .from('sponsors')
        .select('*')
        .order('name');
      return checkError(response) as Sponsor[];
    },
  },

  visits: {
    async create(userId: string, restaurantId: string): Promise<Visit> {
      try {
        const response = await supabase
          .from('visits')
          .insert([{ 
            user_id: userId, 
            restaurant_id: restaurantId,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        return checkError(response) as Visit;
      } catch (error: unknown) {
        // If it's a unique violation (23505), the visit already exists
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
          const response = await supabase
            .from('visits')
            .select()
            .eq('user_id', userId)
            .eq('restaurant_id', restaurantId)
            .single();
          return checkError(response) as Visit;
        }
        throw error;
      }
    },

    async getByUser(userId: string): Promise<VisitWithRestaurant[]> {
      const response = await supabase
        .from('visits')
        .select('*, restaurants(*)')
        .eq('user_id', userId);
      return checkError(response) as VisitWithRestaurant[];
    },

    async checkExists(userId: string, restaurantId: string): Promise<boolean> {
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);
      return (count ?? 0) > 0;
    },
  },

  users: {
    async createIfNotExists(userId: string, email?: string | null) {
      // First check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (existingUser) {
        // If user exists but has no email and we have one, update it
        if (!existingUser.email && email) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ email })
            .eq('id', userId);
          
          if (updateError) throw updateError;
        }
        return;
      }

      // If user doesn't exist, create new user
      const { error } = await supabase
        .from('users')
        .insert([{ id: userId, email }])
        .select()
        .single();
      
      if (error?.code === '23505') return; // Ignore if user was created in parallel
      if (error) throw error;
    },

    async getContactInfo(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', userId)
        .single();
      
      // If user doesn't exist yet or no data found, return null (not an error)
      if (error?.code === 'PGRST116' || !data) {
        return null;
      }
      
      if (error) throw error;
      return data;
    },

    async updateContactInfo(userId: string, name: string | null, phone: string | null) {
      // Simple upsert - will create if not exists, update if exists
      const { error } = await supabase
        .from('users')
        .upsert({ 
          id: userId,
          name,
          phone
        });
      
      if (error) throw error;
    },

    async isAdmin(userId: string): Promise<boolean> {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.log('User not found or error checking admin status:', error);
        return false; // Default to false if user doesn't exist or error
      }
      
      return data.is_admin || false;
    }
  },

  userStats: {
    async getOrCreate(userId: string): Promise<UserStats> {
      // Try to get existing stats first
      const { data: existingStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If stats exist, return them
      if (existingStats) {
        return existingStats;
      }

      // Create new user stats entry
      const { data: newStats, error: createError } = await supabase
        .from('user_stats')
        .insert([{
          user_id: userId,
          visit_count: 0,
          raffle_entries: 0
        }])
        .select()
        .single();

      if (createError) {
        // If stats were created by another request, try to get them again
        if (createError.code === '23505') { // Unique violation
          const { data: retryStats, error: retryError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (retryError) throw retryError;
          if (retryStats) return retryStats;
        }
        throw createError;
      }

      return newStats;
    },
  },
}; 