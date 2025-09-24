-- Temporarily disable RLS for restaurant week
-- This allows your app to work while we fix the Clerk integration

-- Disable RLS on user_stats table
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;

-- Disable RLS on visits table  
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on restaurants and sponsors (they're public read anyway)
-- ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE sponsors DISABLE ROW LEVEL SECURITY;