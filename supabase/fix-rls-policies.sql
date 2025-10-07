-- Fix RLS Policies for Clerk Authentication + Service Role Pattern
-- This script addresses RLS violations when using Clerk auth + Supabase service role

-- First, let's drop all existing policies that are causing issues
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_stats;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON user_stats;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_stats;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON user_stats;

DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON visits;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON visits;

DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- For user_stats table - allow service role operations
CREATE POLICY "Allow service role operations" ON user_stats
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant explicit permissions to service_role for user_stats
GRANT ALL ON user_stats TO service_role;

-- For visits table - allow service role operations  
CREATE POLICY "Allow service role operations" ON visits
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant explicit permissions to service_role for visits
GRANT ALL ON visits TO service_role;

-- For users table - allow service role operations
CREATE POLICY "Allow service role operations" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant explicit permissions to service_role for users
GRANT ALL ON users TO service_role;

-- For restaurants table - already allows public read, but ensure service role can read
GRANT SELECT ON restaurants TO service_role;

-- For sponsors table - already allows public read, but ensure service role can read  
GRANT SELECT ON sponsors TO service_role;

-- Alternative approach: Temporarily disable RLS for easier development
-- Uncomment these lines if the above policies still don't work:

-- ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE visits DISABLE ROW LEVEL SECURITY;  
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Note: Disabling RLS removes security but fixes the immediate issue
-- In production, you'd want proper policies that work with your auth pattern