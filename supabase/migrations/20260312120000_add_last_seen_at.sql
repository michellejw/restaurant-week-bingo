-- Add last_seen_at column to track when users last opened the app
ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMPTZ;

-- Backfill: use updated_at as the best available proxy for existing users
UPDATE users SET last_seen_at = updated_at WHERE last_seen_at IS NULL;
