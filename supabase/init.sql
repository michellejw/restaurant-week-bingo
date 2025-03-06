-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS fix_missing_users() CASCADE;

-- Drop existing tables (in correct dependency order)
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS sponsors;
DROP VIEW IF EXISTS raffle_entries;

-- Create tables
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    url TEXT,
    code TEXT UNIQUE NOT NULL,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    description TEXT,
    phone TEXT,
    specials TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    url TEXT,
    description TEXT,
    promo_offer TEXT,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    is_retail BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stats (
    user_id TEXT PRIMARY KEY,
    visit_count INTEGER DEFAULT 0,
    raffle_entries INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES user_stats(user_id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    visit_count_val INTEGER;
BEGIN
    -- Count all visits for this user
    SELECT COUNT(*) INTO visit_count_val
    FROM visits
    WHERE user_id = NEW.user_id;

    -- Update stats with the actual count
    UPDATE user_stats
    SET 
        visit_count = visit_count_val,
        raffle_entries = FLOOR(visit_count_val/5),
        last_updated = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating stats after visit
CREATE TRIGGER update_stats_on_visit
    AFTER INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Create view for raffle entries
CREATE VIEW raffle_entries AS
SELECT 
    s.user_id,
    s.visit_count,
    s.raffle_entries,
    array_agg(DISTINCT r.name) as visited_restaurants
FROM user_stats s
LEFT JOIN visits v ON s.user_id = v.user_id
LEFT JOIN restaurants r ON v.restaurant_id = r.id
GROUP BY s.user_id, s.visit_count, s.raffle_entries;

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- User stats policies
CREATE POLICY "Enable read for users based on user_id" ON user_stats
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Enable update for users based on user_id" ON user_stats
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Enable insert for users based on user_id" ON user_stats
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Restaurant policies - allow public read access
CREATE POLICY "Enable read access for all users" ON restaurants
    FOR SELECT
    USING (true);

-- Sponsor policies - allow public read access
CREATE POLICY "Enable read access for all users" ON sponsors
    FOR SELECT
    USING (true);

-- Visit policies
CREATE POLICY "Enable read for users based on user_id" ON visits
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Enable insert for users based on user_id" ON visits
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT permissions to both anon and authenticated users for public data
GRANT SELECT ON restaurants TO anon, authenticated;
GRANT SELECT ON sponsors TO anon, authenticated;

-- Grant necessary permissions to authenticated users for their own data
GRANT SELECT, INSERT, UPDATE ON user_stats TO authenticated;
GRANT SELECT, INSERT ON visits TO authenticated;

-- Insert sample restaurants
INSERT INTO restaurants (name, address, url, code, latitude, longitude) VALUES
    ('SeaWitch Cafe', 
     '227 Carolina Beach Ave N, Carolina Beach, NC 28428', 
     'https://seawitchcafeandbrew.com', 
     'SEAWITCH2024',
     34.0352, 
     -77.8936),
    ('Havanas Fresh Island Restaurant', 
     '1 N Lake Park Blvd, Carolina Beach, NC 28428', 
     'https://havanasfresh.com', 
     'HAVANAS2024',
     34.0382, 
     -77.8931),
    ('The Fork n Cork', 
     '102 Cape Fear Blvd, Carolina Beach, NC 28428', 
     'https://theforkncork.com', 
     'FORKNCORK2024',
     34.0358, 
     -77.8947),
    ('Lake Park Steakhouse',
     '300 Lake Park Blvd S, Carolina Beach, NC 28428',
     'https://www.lakeparksteakhouse.com',
     'STEAKHOUSE2024',
     34.0332,
     -77.8935),
    ('Celtic Creamery',
     '1006 Lake Park Blvd S, Carolina Beach, NC 28428',
     'https://celticcreamery.com',
     'CELTIC2024',
     34.0275,
     -77.8933),
    ('Michaels Seafood Restaurant',
     '1206 N Lake Park Blvd, Carolina Beach, NC 28428',
     'https://www.mikescfood.com',
     'MICHAELS2024',
     34.0398,
     -77.8931),
    ('Surf House Oyster Bar',
     '604 N Lake Park Blvd, Carolina Beach, NC 28428',
     'https://surfhousenc.com',
     'SURFHOUSE2024',
     34.0367,
     -77.8932),
    ('Gibbys Dock & Dine',
     '1317 Canal Dr, Carolina Beach, NC 28428',
     'https://gibbysdockanddine.com',
     'GIBBYS2024',
     34.0408,
     -77.8918),
    ('Hurricane Allies',
     '1020 Lake Park Blvd N, Carolina Beach, NC 28428',
     'https://hurricaneallies.com',
     'ALLIES2024',
     34.0389,
     -77.8931),
    ('Island Burgers & Bites',
     '801 N Lake Park Blvd, Carolina Beach, NC 28428',
     'https://islandburgersnc.com',
     'BURGERS2024',
     34.0375,
     -77.8932),
    ('Nollies Taco Joint',
     '1101 N Lake Park Blvd, Carolina Beach, NC 28428',
     'https://nolliescb.com',
     'NOLLIES2024',
     34.0393,
     -77.8931),
    ('Kates Pancake House',
     '102 S Lake Park Blvd, Carolina Beach, NC 28428',
     'https://katespancakehouse.com',
     'KATES2024',
     34.0349,
     -77.8935);