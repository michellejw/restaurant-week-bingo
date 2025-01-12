import { supabase, checkSupabaseConnection } from './supabase';
import { Restaurant, RestaurantVisit, RestaurantWithVisitStatus } from '@/types/restaurant';

export async function getAllRestaurants(): Promise<Restaurant[]> {
    console.log('Fetching restaurants...');
    
    // First check if we can connect to Supabase
    const canConnect = await checkSupabaseConnection();
    console.log('Can connect to Supabase:', canConnect);

    const response = await supabase
        .from('restaurants')
        .select('*', { count: 'exact' });
    
    console.log('Raw Supabase response:', {
        status: response.status,
        statusText: response.statusText,
        error: response.error,
        data: response.data,
        count: response.count
    });

    if (response.error) {
        console.error('Error fetching restaurants:', {
            error: response.error,
            status: response.status,
            statusText: response.statusText,
            message: response.error.message,
            details: response.error.details
        });
        throw response.error;
    }

    console.log(`Found ${response.count} restaurants:`, response.data);
    return response.data || [];
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