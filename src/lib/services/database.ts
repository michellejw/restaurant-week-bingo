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
    async createIfNotExists(userId: string) {
      const { error } = await supabase
        .from('users')
        .insert([{ id: userId }])
        .select()
        .single();
      
      // Ignore if user already exists
      if (error?.code === '23505') return; // Unique violation error
      if (error) throw error;
    },

    async getContactInfo(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', userId)
        .single();
      
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
    }
  },

  userStats: {
    async getOrCreate(userId: string): Promise<UserStats> {
      try {
        // Try to get existing stats first
        const { data: existingStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        // If stats exist, return them
        if (existingStats) return existingStats;

        // If no stats exist, ensure user exists first
        await DatabaseService.users.createIfNotExists(userId);

        // Then create stats
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
      } catch (error) {
        console.error('Error in getOrCreate:', error);
        throw error;
      }
    },

    async incrementVisits(userId: string): Promise<UserStats> {
      // First get current stats
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!currentStats) throw new Error('User stats not found');

      // Calculate new values
      const newVisitCount = currentStats.visit_count + 1;
      const newRaffleEntries = Math.floor(newVisitCount / 5);

      // Update with new values
      const response = await supabase
        .from('user_stats')
        .update({ 
          visit_count: newVisitCount,
          raffle_entries: newRaffleEntries
        })
        .eq('user_id', userId)
        .select()
        .single();
        
      return checkError(response);
    },
  },
}; 