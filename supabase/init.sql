-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS handle_new_auth0_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS get_auth0_id() CASCADE;

-- Drop existing tables (in correct dependency order)
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS restaurants;
DROP VIEW IF EXISTS raffle_entries;

-- Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth0_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users,
    visit_count INTEGER DEFAULT 0,
    raffle_entries INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    url TEXT,
    code TEXT UNIQUE NOT NULL,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users NOT NULL,
    restaurant_id UUID REFERENCES restaurants NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- Create Auth0 helper function
CREATE OR REPLACE FUNCTION get_auth0_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;

-- Create user management functions
CREATE OR REPLACE FUNCTION handle_new_auth0_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_stats (user_id, visit_count, raffle_entries)
    VALUES (NEW.id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_auth0_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    visit_count_val INTEGER;
BEGIN
    SELECT COUNT(*) INTO visit_count_val
    FROM visits
    WHERE user_id = NEW.user_id;

    UPDATE user_stats
    SET 
        visit_count = visit_count_val,
        raffle_entries = FLOOR(visit_count_val/5),
        last_updated = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_auth0_user();

CREATE TRIGGER update_stats_on_visit
    AFTER INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Create indexes
CREATE INDEX visits_user_id_idx ON visits(user_id);
CREATE INDEX visits_restaurant_id_idx ON visits(restaurant_id);
CREATE INDEX restaurants_code_idx ON restaurants(code);
CREATE INDEX users_auth0_id_idx ON users(auth0_id);

-- Create raffle entries view
CREATE OR REPLACE VIEW raffle_entries AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    us.visit_count,
    us.raffle_entries,
    array_agg(DISTINCT r.name) as visited_restaurants
FROM users u
JOIN user_stats us ON u.id = us.user_id
LEFT JOIN visits v ON u.id = v.user_id
LEFT JOIN restaurants r ON v.restaurant_id = r.id
GROUP BY u.id, u.email, u.name, us.visit_count, us.raffle_entries;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth0_id = get_auth0_id());

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth0_id = get_auth0_id());

CREATE POLICY "Users can read own stats" ON user_stats
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE auth0_id = get_auth0_id()
    ));

CREATE POLICY "Users can read own visits" ON visits
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE auth0_id = get_auth0_id()
    ));

CREATE POLICY "Users can create visits" ON visits
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE auth0_id = get_auth0_id()
    ));

CREATE POLICY "Restaurants are readable by all" ON restaurants
    FOR SELECT USING (true);

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
     -77.8947);