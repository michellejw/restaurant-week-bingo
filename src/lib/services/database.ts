import { supabase, checkError } from '../supabase';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type Restaurant = Tables['restaurants']['Row'];
type Visit = Tables['visits']['Row'];
type UserStats = Tables['user_stats']['Row'];
type UserProfile = Tables['users']['Row'];
type Sponsor = Tables['sponsors']['Row'];

type VisitWithRestaurant = Visit & {
  restaurants: Restaurant;
};

export const DatabaseService = {
  restaurants: {
    async getAll(): Promise<Restaurant[]> {
      console.log('📍 Fetching all restaurants');
      const response = await supabase
        .from('restaurants')
        .select('*');
      console.log('📍 Restaurants response:', response);
      return checkError(response) as Restaurant[];
    },

    async getByCode(code: string): Promise<Restaurant> {
      console.log('📍 Fetching restaurant by code:', code);
      const response = await supabase
        .from('restaurants')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      console.log('📍 Restaurant by code response:', response);
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
    async get(userId: string): Promise<UserStats> {
      console.log('📊 Fetching user stats for:', userId);
      const response = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      console.log('📊 User stats response:', response);
      
      // If we get a 406 with PGRST116, it means no rows found
      if (response.error?.code === 'PGRST116') {
        console.log('📊 No stats found, waiting briefly before creating default stats...');
        // Add a small delay to ensure user record is fully created
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.createOrUpdate(userId, {
          visit_count: 0,
          raffle_entries: 0
        });
      }
      
      return checkError(response) as UserStats;
    },

    async createOrUpdate(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
      console.log('📊 Updating user stats:', { userId, stats });
      try {
        const response = await supabase
          .from('user_stats')
          .upsert([{ 
            user_id: userId,
            visit_count: 0,
            raffle_entries: 0,
            ...stats 
          }])
          .select()
          .single();
        console.log('📊 Update stats response:', response);
        return checkError(response);
      } catch (error) {
        console.error('📊 Error updating stats:', error);
        throw error;
      }
    },
  },

  users: {
    async getProfile(userId: string): Promise<UserProfile> {
      const response = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      return checkError(response);
    },

    async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
      const response = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      return checkError(response);
    },
  },
}; 