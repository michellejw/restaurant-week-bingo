-- Fix user_stats triggers to handle both INSERT and DELETE operations
-- This ensures user_stats table stays consistent when visits are added or removed

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_stats_on_visit ON visits;
DROP TRIGGER IF EXISTS update_stats_on_visit_delete ON visits;
DROP FUNCTION IF EXISTS update_user_stats() CASCADE;

-- Create improved function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    affected_user_id TEXT;
    visit_count_val INTEGER;
BEGIN
    -- Get the user_id that was affected (works for both INSERT and DELETE)
    IF TG_OP = 'DELETE' THEN
        affected_user_id := OLD.user_id;
    ELSE
        affected_user_id := NEW.user_id;
    END IF;

    -- Count all visits for this user
    SELECT COUNT(*) INTO visit_count_val
    FROM visits
    WHERE user_id = affected_user_id;

    -- Update stats with the actual count
    INSERT INTO user_stats (user_id, visit_count, raffle_entries, updated_at)
    VALUES (affected_user_id, visit_count_val, FLOOR(visit_count_val/3), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        visit_count = visit_count_val,
        raffle_entries = FLOOR(visit_count_val/3),
        updated_at = NOW();
    
    -- If user has 0 visits, we might want to keep the record but with 0 counts
    -- This is useful for tracking users who had visits but then had them removed
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for both INSERT and DELETE operations
CREATE TRIGGER update_stats_on_visit_insert
    AFTER INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_stats_on_visit_delete
    AFTER DELETE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Optional: Fix any existing inconsistencies by recalculating all user stats
-- This will bring the user_stats table back in sync with actual visits data
INSERT INTO user_stats (user_id, visit_count, raffle_entries, updated_at)
SELECT 
    v.user_id,
    COUNT(*) as visit_count,
    FLOOR(COUNT(*)/3) as raffle_entries,
    NOW() as updated_at
FROM visits v
GROUP BY v.user_id
ON CONFLICT (user_id) 
DO UPDATE SET 
    visit_count = EXCLUDED.visit_count,
    raffle_entries = EXCLUDED.raffle_entries,
    updated_at = EXCLUDED.updated_at;

-- Comment: This script ensures that:
-- 1. user_stats is updated when visits are added (INSERT trigger)
-- 2. user_stats is updated when visits are removed (DELETE trigger)  
-- 3. Any existing inconsistencies are fixed by recalculating from visits
-- 4. The raffle_entries are correctly calculated as FLOOR(visit_count/3)
