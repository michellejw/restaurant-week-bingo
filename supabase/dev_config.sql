-- Development Environment Configuration
-- Run this AFTER applying the main schema (updated_schema.sql) for development databases
-- This disables RLS to make testing easier when using Clerk authentication

-- Disable RLS on user-related tables for easier development
-- Note: Only run this in development databases, NOT in production!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY; 
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on public data tables
-- (restaurants and sponsors should remain enabled since they're public anyway)

-- Optional: If you need to re-enable RLS later (for production-like testing):
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Optional: Create more permissive policies if you want RLS enabled but less strict:
-- DROP POLICY IF EXISTS "Enable all for authenticated users" ON users;
-- CREATE POLICY "Enable all for authenticated users" ON users
--     FOR ALL TO authenticated
--     USING (true)
--     WITH CHECK (true);

-- DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_stats;
-- CREATE POLICY "Enable all for authenticated users" ON user_stats
--     FOR ALL TO authenticated
--     USING (true)
--     WITH CHECK (true);