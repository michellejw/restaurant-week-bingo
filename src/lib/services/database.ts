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
      const response = await supabase
        .from('visits')
        .insert([{ user_id: userId, restaurant_id: restaurantId }])
        .select()
        .single();
      return checkError(response) as Visit;
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

  userStats: {
    async getOrCreate(userId: string): Promise<UserStats> {
      // Try to get existing stats
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If no stats exist, create them
      if (error?.code === 'PGRST116') {
        const response = await supabase
          .from('user_stats')
          .insert([{ 
            user_id: userId,
            visit_count: 0,
            raffle_entries: 0
          }])
          .select()
          .single();
        return checkError(response);
      }

      // If there was a different error, throw it
      if (error) throw error;

      // Otherwise return the existing stats
      return data;
    },

    async incrementVisits(userId: string): Promise<UserStats> {
      const response = await supabase
        .from('user_stats')
        .update({ 
          visit_count: supabase.rpc('increment'),
          raffle_entries: supabase.rpc('calculate_raffle_entries')
        })
        .eq('user_id', userId)
        .select()
        .single();
      return checkError(response);
    },
  },
}; 