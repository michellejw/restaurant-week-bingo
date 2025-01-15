export interface Restaurant {
  id: string;
  name: string;
  address: string;
  url?: string;
  latitude: number;
  longitude: number;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantVisit {
  id: string;
  userId: string;
  restaurantId: string;
  visitedAt: string;
  restaurant?: Restaurant;
}

export interface RaffleEntry {
  id: string;
  userId: string;
  createdAt: string;
  squares: number;
} 