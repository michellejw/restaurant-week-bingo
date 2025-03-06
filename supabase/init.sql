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
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS sponsors;
DROP VIEW IF EXISTS raffle_entries;

-- Create tables
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- Grant initial permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Create user management functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, insert into users table
    INSERT INTO users (id, email, name)
    VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1))
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
DECLARE
    visit_count_val INTEGER;
BEGIN
    -- Count all visits for this user
    SELECT COUNT(*) INTO visit_count_val
    FROM visits
    WHERE user_id = NEW.user_id;

    -- Update stats with the actual count
    INSERT INTO user_stats (user_id, visit_count, raffle_entries)
    VALUES (
        NEW.user_id,
        visit_count_val,
        FLOOR(visit_count_val/5)
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        visit_count = EXCLUDED.visit_count,
        raffle_entries = EXCLUDED.raffle_entries,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recovery function for missing users
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
WHERE u.id = (auth.uid()::uuid)
GROUP BY u.id, u.email, u.name, us.visit_count, us.raffle_entries;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "System can manage user stats" ON user_stats;
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view sponsors" ON sponsors;
DROP POLICY IF EXISTS "Users can view their own visits" ON visits;
DROP POLICY IF EXISTS "Users can create their own visits" ON visits;

-- Create RLS policies
CREATE POLICY "Enable read for authenticated users" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Enable update for users based on id" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

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
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
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

-- Fix any existing users
SELECT fix_missing_users();

-- Enable RLS
alter table restaurants enable row level security;
alter table sponsors enable row level security;
alter table users enable row level security;
alter table visits enable row level security;
alter table user_stats enable row level security;

-- Drop any existing policies
drop policy if exists "Public read access to restaurants" on restaurants;
drop policy if exists "Public read access to sponsors" on sponsors;
drop policy if exists "Users can read their own data" on users;
drop policy if exists "Users can read their own visits" on visits;
drop policy if exists "Users can read their own stats" on user_stats;

-- Create new policies
create policy "Public read access to restaurants"
  on restaurants
  for select
  to public
  using (true);

create policy "Public read access to sponsors"
  on sponsors
  for select
  to public
  using (true);

create policy "Users can read their own data"
  on users
  for select
  using (auth.uid::text = id);

create policy "Users can read their own visits"
  on visits
  for select
  using (auth.uid::text = user_id);

create policy "Users can read their own stats"
  on user_stats
  for select
  using (auth.uid::text = user_id);

-- Allow users to insert their own visits
create policy "Users can insert their own visits"
  on visits
  for insert
  with check (auth.uid::text = user_id);

-- Allow users to update their own stats
create policy "Users can update their own stats"
  on user_stats
  for update
  using (auth.uid::text = user_id);