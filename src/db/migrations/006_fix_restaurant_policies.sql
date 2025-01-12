-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Restaurants are viewable by everyone" ON restaurants;
DROP POLICY IF EXISTS "Admins can manage restaurants" ON restaurants;

-- Create a simple policy that allows anyone to view restaurants
CREATE POLICY "Public read access for restaurants"
    ON restaurants FOR SELECT
    USING (true);

-- Create policy for admin management
CREATE POLICY "Admin management for restaurants"
    ON restaurants
    FOR ALL
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users WHERE raw_user_meta_data->>'isAdmin' = 'true'
        )
    ); 