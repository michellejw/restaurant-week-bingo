export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          address: string;
          url: string | null;
          code: string;
          latitude: number;
          longitude: number;
          description: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>;
      };
      sponsors: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string | null;
          url: string | null;
          description: string | null;
          promo_offer: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sponsors']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sponsors']['Insert']>;
      };
      visits: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['visits']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['visits']['Insert']>;
      };
      user_stats: {
        Row: {
          user_id: string;
          visit_count: number;
          raffle_entries: number;
          last_updated: string;
        };
        Insert: Omit<Database['public']['Tables']['user_stats']['Row'], 'last_updated'>;
        Update: Partial<Database['public']['Tables']['user_stats']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
          last_login: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'last_login'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
    };
    Views: {
      raffle_entries: {
        Row: {
          user_id: string;
          email: string;
          name: string | null;
          visit_count: number;
          raffle_entries: number;
          visited_restaurants: string[] | null;
        };
      };
    };
  };
}; 