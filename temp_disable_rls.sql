-- Temporarily disable RLS to test access
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurants'; 