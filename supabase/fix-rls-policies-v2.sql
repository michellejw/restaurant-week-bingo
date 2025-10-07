-- Fix RLS Policies for Clerk Authentication (Works with both anon and service role)
-- This addresses the 406 errors by allowing anon role access as well

-- Drop the restrictive policies we just created
DROP POLICY IF EXISTS "Allow service role operations" ON user_stats;
DROP POLICY IF EXISTS "Allow service role operations" ON visits;
DROP POLICY IF EXISTS "Allow service role operations" ON users;

-- Create policies that allow both anon and service_role access
-- Since you're using Clerk for auth, we trust the application layer to handle security

-- For user_stats table - allow anon and service role
CREATE POLICY "Allow all operations for app" ON user_stats
    FOR ALL
    TO anon, service_role
    USING (true)
    WITH CHECK (true);

-- For visits table - allow anon and service role
CREATE POLICY "Allow all operations for app" ON visits
    FOR ALL
    TO anon, service_role
    USING (true)
    WITH CHECK (true);

-- For users table - allow anon and service role
CREATE POLICY "Allow all operations for app" ON users
    FOR ALL
    TO anon, service_role
    USING (true)
    WITH CHECK (true);

-- Grant permissions to anon role (which the frontend uses)
GRANT SELECT, INSERT, UPDATE ON user_stats TO anon;
GRANT SELECT, INSERT ON visits TO anon;
GRANT SELECT, INSERT, UPDATE ON users TO anon;

-- Ensure service role still has permissions
GRANT ALL ON user_stats TO service_role;
GRANT ALL ON visits TO service_role;
GRANT ALL ON users TO service_role;
GRANT SELECT ON restaurants TO service_role;
GRANT SELECT ON sponsors TO service_role;