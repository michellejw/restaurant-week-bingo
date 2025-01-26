import { supabase, checkError } from '../supabase';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type Restaurant = Tables['restaurants']['Row'];
type Visit = Tables['visits']['Row'];
type UserStats = Tables['user_stats']['Row'];
type UserProfile = Tables['users']['Row'];

export const DatabaseService = {
  restaurants: {
    async getAll(): Promise<Restaurant[]> {
      const response = await supabase.from('restaurants').select('*');
      return checkError(response);
    },

    async getByCode(code: string): Promise<Restaurant> {
      const response = await supabase
        .from('restaurants')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      return checkError(response);
    },
  },

  visits: {
    async create(userId: string, restaurantId: string): Promise<Visit> {
      const response = await supabase
        .from('visits')
        .insert([{ user_id: userId, restaurant_id: restaurantId }])
        .select()
        .single();
      return checkError(response);
    },

    async getByUser(userId: string): Promise<Visit[]> {
      const response = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId);
      return checkError(response);
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
      const response = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      return checkError(response);
    },

    async createOrUpdate(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
      const response = await supabase
        .from('user_stats')
        .upsert([{ user_id: userId, ...stats }])
        .select()
        .single();
      return checkError(response);
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