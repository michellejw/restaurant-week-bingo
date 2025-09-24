-- Create the missing users table
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

-- Insert user data from backup
INSERT INTO users (id, created_at, updated_at, name, phone, email) VALUES
('user_2u2nzPFQ3ETYI8f2LYczVotDSxq', '2025-03-08 17:43:22.014326+00', '2025-03-08 17:43:22.014326+00', 'Sabrina Burkhead', '9198128478', NULL),
('user_2u6LUeN7d9UQiJGDHTxmairwxRc', '2025-03-09 23:48:37.599941+00', '2025-03-09 23:48:37.599941+00', 'Carris Loomis ', '5857299987', 'littlelattie75@gmail.com'),
('user_2u2k6IVLvLc0n59sb7kaBw8UPfz', '2025-03-08 17:11:25.143454+00', '2025-03-08 17:11:25.143454+00', 'Marlond Meadows', '7046098549', 'marlondmeadows@yahoo.com'),
('user_2u3l38QxwffPhUVl6JnPyQVUNQI', '2025-03-09 01:52:21.08364+00', '2025-03-09 01:52:21.08364+00', 'Beth Wrobel', '2194058481', 'bwrobel1205@gmail.com'),
('user_2u2yNqNRkJO5jXlxOdbftm3t2JS', '2025-03-08 19:08:53.739584+00', '2025-03-08 19:08:53.739584+00', NULL, NULL, 'ackratzer@gmail.com'),
('user_2uAPOsDgp324qKkmDVQpErERqhZ', '2025-03-11 10:20:19.158847+00', '2025-03-11 10:20:19.158847+00', NULL, NULL, NULL),
('user_2u5tmZCemLIhJ9IxlmisFdKdaao', '2025-03-09 20:00:25.399178+00', '2025-03-09 20:00:25.399178+00', NULL, NULL, 'jillclassic@gmail.com'),
('user_2u2uvIm6dO6yekhCCGcYd9in7Ax', '2025-03-08 18:40:22.768175+00', '2025-03-08 18:40:22.768175+00', 'Avra Lynne Aubin', '2036756495', NULL),
('user_2u3KNWzMVdc4onMnplENhud64rq', '2025-03-08 22:09:41.361424+00', '2025-03-08 22:09:41.361424+00', NULL, NULL, NULL),
('user_2uAc2khkMklawQ2Q8Jhnj587s91', '2025-03-11 12:03:49.34649+00', '2025-03-11 12:03:49.34649+00', NULL, NULL, 'kdb2012us@gmail.com');