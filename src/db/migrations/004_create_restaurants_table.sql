-- Create restaurants table
CREATE TABLE restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    website_url TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create visits table to track user visits
CREATE TABLE restaurant_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, restaurant_id)
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_visits ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurants
-- Anyone can view restaurants
CREATE POLICY "Restaurants are viewable by everyone" ON restaurants
    FOR SELECT USING (true);

-- Only admins can insert/update/delete restaurants
CREATE POLICY "Admins can manage restaurants" ON restaurants
    FOR ALL USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users WHERE raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- Create policies for restaurant_visits
-- Users can view their own visits
CREATE POLICY "Users can view their own visits" ON restaurant_visits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own visits
CREATE POLICY "Users can insert their own visits" ON restaurant_visits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 