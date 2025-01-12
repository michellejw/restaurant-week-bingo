export interface Restaurant {
    id: string;
    name: string;
    address: string;
    website_url?: string;
    latitude: number;
    longitude: number;
    qr_code?: string;
    created_at: string;
    updated_at: string;
}

export interface RestaurantVisit {
    id: string;
    user_id: string;
    restaurant_id: string;
    visited_at: string;
}

export type RestaurantWithVisitStatus = Restaurant & {
    isVisited: boolean;
}; 