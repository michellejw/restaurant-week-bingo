-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing functions and triggers if they exist
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS fix_missing_users() CASCADE;

-- Drop existing tables (in correct dependency order)
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP VIEW IF EXISTS raffle_entries CASCADE;

-- Create restaurants table (updated schema from backup)
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
    promotions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    logo_file TEXT
);

-- Create sponsors table (updated schema from backup)
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    logo_file TEXT
);

-- Create users table for contact information (must be created before user_stats)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Create user_stats table (updated schema from backup)
CREATE TABLE user_stats (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    visit_count INTEGER DEFAULT 0,
    raffle_entries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create visits table 
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
    INSERT INTO user_stats (user_id, visit_count, raffle_entries, updated_at)
    VALUES (NEW.user_id, visit_count_val, FLOOR(visit_count_val/3), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        visit_count = visit_count_val,
        raffle_entries = FLOOR(visit_count_val/3),
        updated_at = NOW();
    
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

-- User stats policies - Compatible with Clerk authentication
-- These policies allow both anon (frontend) and service_role (scripts) access
CREATE POLICY "Allow all operations for app" ON user_stats
    FOR ALL
    TO anon, service_role
    USING (true)
    WITH CHECK (true);

-- Restaurant policies - allow public read access
CREATE POLICY "Enable read access for all users" ON restaurants
    FOR SELECT
    USING (true);

-- Sponsor policies - allow public read access
CREATE POLICY "Enable read access for all users" ON sponsors
    FOR SELECT
    USING (true);

-- Visit policies - Compatible with Clerk authentication
CREATE POLICY "Allow all operations for app" ON visits
    FOR ALL
    TO anon, service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT permissions to both anon and authenticated users for public data
GRANT SELECT ON restaurants TO anon, authenticated;
GRANT SELECT ON sponsors TO anon, authenticated;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users table policy - Compatible with Clerk authentication
CREATE POLICY "Allow all operations for app" ON users
    FOR ALL
    TO anon, service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions for Clerk authentication pattern
-- Frontend (anon key) needs these permissions
GRANT SELECT, INSERT, UPDATE ON user_stats TO anon;
GRANT SELECT, INSERT ON visits TO anon;
GRANT SELECT, INSERT, UPDATE ON users TO anon;

-- Service role (scripts) needs full permissions
GRANT ALL ON user_stats TO service_role;
GRANT ALL ON visits TO service_role;
GRANT ALL ON users TO service_role;
GRANT SELECT ON restaurants TO service_role;
GRANT SELECT ON sponsors TO service_role;

-- NOTE: This schema is compatible with Clerk authentication in both dev and production.
-- The RLS policies allow both anon (frontend) and service_role (scripts) access,
-- which matches the hybrid Clerk + Supabase architecture used by this application.
