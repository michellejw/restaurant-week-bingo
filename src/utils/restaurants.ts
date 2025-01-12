import { supabase } from './supabase';
import { Restaurant, RestaurantVisit, RestaurantWithVisitStatus } from '@/types/restaurant';

export async function getAllRestaurants(): Promise<Restaurant[]> {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');
    
    if (error) throw error;
    return data || [];
}

export async function getRestaurantsWithVisitStatus(userId: string): Promise<RestaurantWithVisitStatus[]> {
    // First get all restaurants
    const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');
    
    if (restaurantsError) throw restaurantsError;

    // Then get all visits for this user
    const { data: visits, error: visitsError } = await supabase
        .from('restaurant_visits')
        .select('restaurant_id')
        .eq('user_id', userId);
    
    if (visitsError) throw visitsError;

    // Create a Set of visited restaurant IDs for efficient lookup
    const visitedRestaurantIds = new Set(visits?.map(visit => visit.restaurant_id));

    // Combine the data
    return (restaurants || []).map(restaurant => ({
        ...restaurant,
        isVisited: visitedRestaurantIds.has(restaurant.id)
    }));
}

export async function markRestaurantAsVisited(userId: string, restaurantId: string): Promise<void> {
    const { error } = await supabase
        .from('restaurant_visits')
        .insert([
            {
                user_id: userId,
                restaurant_id: restaurantId
            }
        ]);
    
    if (error) throw error;
}

export async function getVisitCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('restaurant_visits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    
    if (error) throw error;
    return count || 0;
} 