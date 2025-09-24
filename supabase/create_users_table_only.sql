-- Create the users table structure (empty, will auto-populate from Clerk)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- User policies - Clerk-compatible (trust authenticated requests)
CREATE POLICY "Enable read for authenticated users" ON users
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable update for authenticated users" ON users
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (true);