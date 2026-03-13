-- Baseline schema: captures the state of the database before tracked migrations began.
-- This file is not applied to existing databases (they already have these objects).
-- It exists so that `supabase db pull` can replay the full migration history
-- from an empty shadow database.

-- ============================================
-- Tables
-- ============================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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

CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_stats (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    visit_count INTEGER DEFAULT 0,
    raffle_entries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id TEXT REFERENCES user_stats(user_id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- ============================================
-- Functions and triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    visit_count_val INTEGER;
BEGIN
    SELECT COUNT(*) INTO visit_count_val
    FROM visits
    WHERE user_id = NEW.user_id;

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

CREATE TRIGGER update_stats_on_visit
    AFTER INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- ============================================
-- Views
-- ============================================

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

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Original permissive policies (tighten_rls migration replaces these)
CREATE POLICY "Allow anon full access" ON user_stats
    FOR ALL TO anon, service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON restaurants
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON sponsors
    FOR SELECT USING (true);

CREATE POLICY "Allow anon full access" ON visits
    FOR ALL TO anon, service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon full access" ON users
    FOR ALL TO anon, service_role
    USING (true) WITH CHECK (true);
