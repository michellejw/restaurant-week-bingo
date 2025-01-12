-- First, make sure RLS is enabled
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON restaurants;
DROP POLICY IF EXISTS "Admins can manage restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public read access for restaurants" ON restaurants;
DROP POLICY IF EXISTS "Admin management for restaurants" ON restaurants;

-- Create a simple policy that allows anyone to view restaurants
-- This is the most permissive read policy
CREATE POLICY "Allow anonymous read access"
    ON restaurants FOR SELECT
    TO anon, authenticated
    USING (true);

-- Verify the policy
SELECT * FROM pg_policies WHERE tablename = 'restaurants'; 