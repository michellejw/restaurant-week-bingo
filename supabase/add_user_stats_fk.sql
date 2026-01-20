-- Add foreign key relationship from user_stats to users
-- This fixes the query error: "Could not find a relationship between 'user_stats' and 'users'"

ALTER TABLE user_stats 
ADD CONSTRAINT user_stats_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
