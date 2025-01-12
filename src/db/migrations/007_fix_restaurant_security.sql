-- Keep the permissions we just added
GRANT SELECT ON restaurants TO anon;
GRANT SELECT ON restaurants TO authenticated;

-- Re-enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create a policy that works with our permissions
CREATE POLICY "Public read access for restaurants"
    ON restaurants FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only allow admins to modify the data
CREATE POLICY "Admin modify access for restaurants"
    ON restaurants
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN (
            SELECT email FROM auth.users WHERE raw_user_meta_data->>'isAdmin' = 'true'
        )
    ); 