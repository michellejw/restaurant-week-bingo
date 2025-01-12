-- Grant basic permissions to public (anonymous) access
GRANT SELECT ON restaurants TO anon;
GRANT SELECT ON restaurants TO authenticated;

-- Verify permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'restaurants'; 