-- First, enable RLS on the restaurants table
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins full access" ON restaurants;
DROP POLICY IF EXISTS "Allow users to view" ON restaurants;

-- Create policy for admin users (full access)
CREATE POLICY "Allow admins full access" ON restaurants
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.email = auth.jwt()->>'email' 
    AND users."isAdmin" = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.email = auth.jwt()->>'email' 
    AND users."isAdmin" = true
  ));

-- Create policy for all authenticated users (view only)
CREATE POLICY "Allow users to view" ON restaurants
  FOR SELECT
  USING (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurants TO authenticated; 