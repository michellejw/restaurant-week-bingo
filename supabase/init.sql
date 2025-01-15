-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing functions first (before dropping triggers)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS fix_missing_users() CASCADE;

-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS restaurants;
DROP VIEW IF EXISTS raffle_entries;

-- Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users,
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

-- Grant initial permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Create functions with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, insert into users table
    INSERT INTO users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        last_login = NOW();

    -- Then, create user stats
    INSERT INTO user_stats (user_id, visit_count, raffle_entries)
    VALUES (NEW.id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (user_id, visit_count, raffle_entries)
    VALUES (
        NEW.user_id,
        1,
        FLOOR(1/5)
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        visit_count = user_stats.visit_count + 1,
        raffle_entries = FLOOR((user_stats.visit_count + 1)/5),
        last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fix_missing_users()
RETURNS void AS $$
DECLARE
    missing_user RECORD;
BEGIN
    FOR missing_user IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        INSERT INTO public.users (id, email)
        VALUES (missing_user.id, missing_user.email)
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            last_login = NOW();

        INSERT INTO public.user_stats (user_id, visit_count, raffle_entries)
        VALUES (missing_user.id, 0, 0)
        ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_stats_on_visit
    AFTER INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Create indexes
CREATE INDEX visits_user_id_idx ON visits(user_id);
CREATE INDEX visits_restaurant_id_idx ON visits(restaurant_id);
CREATE INDEX restaurants_code_idx ON restaurants(code);

-- Create view
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
WHERE auth.uid() = u.id
GROUP BY u.id, u.email, u.name, us.visit_count, us.raffle_entries;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON raffle_entries TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_stats TO authenticated;
GRANT ALL ON visits TO authenticated;
GRANT SELECT ON restaurants TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- User stats policies
CREATE POLICY "Users can view their own stats" ON user_stats
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON user_stats
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON user_stats
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage user stats" ON user_stats
    FOR ALL TO postgres
    USING (true)
    WITH CHECK (true);

-- Restaurant policies
CREATE POLICY "Anyone can view restaurants" ON restaurants
    FOR SELECT TO authenticated
    USING (true);

-- Visit policies
CREATE POLICY "Users can view their own visits" ON visits
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visits" ON visits
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Insert sample data
INSERT INTO restaurants (name, address, url, code, latitude, longitude) VALUES
    ('SeaWitch Cafe', '227 Carolina Beach Ave N, Carolina Beach, NC 28428', 'https://seawitchcafeandbrew.com', 'SEAWITCH2024', 34.0352, -77.8936),
    ('Havanas Fresh Island Restaurant', '1 N Lake Park Blvd, Carolina Beach, NC 28428', 'https://havanasfresh.com', 'HAVANAS2024', 34.0382, -77.8931),
    ('The Fork n Cork', '102 Cape Fear Blvd, Carolina Beach, NC 28428', 'https://theforkncork.com', 'FORKNCORK2024', 34.0358, -77.8947);

-- Fix any existing users
SELECT fix_missing_users(); 