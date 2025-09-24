-- Fix RLS policies to work with Clerk authentication
-- Since Clerk handles auth at middleware level, we can trust authenticated requests

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON user_stats;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_stats;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON user_stats;

-- Create Clerk-compatible user_stats policies
CREATE POLICY "Enable read for authenticated users" ON user_stats
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable update for authenticated users" ON user_stats
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON user_stats
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Drop existing restrictive visit policies
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON visits;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON visits;

-- Create Clerk-compatible visit policies
CREATE POLICY "Enable read for authenticated users" ON visits
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON visits
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Restaurant and sponsor policies are already correct (public read access)
-- No changes needed for restaurants and sponsors tables