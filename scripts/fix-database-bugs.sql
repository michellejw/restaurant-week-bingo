-- Fix bug: update raffle entry calculation to /3
-- Fix Bug 2: Ensure trigger uses correct calculation

-- Drop and recreate the trigger function with correct calculation
DROP FUNCTION IF EXISTS update_user_stats();

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    visit_count_val INTEGER;
BEGIN
    -- Count all visits for this user
    SELECT COUNT(*) INTO visit_count_val
    FROM visits
    WHERE user_id = NEW.user_id;

    -- Update stats with the actual count (using /3 rule)
    INSERT INTO user_stats (user_id, visit_count, raffle_entries, updated_at)
    VALUES (NEW.user_id, visit_count_val, FLOOR(visit_count_val/3), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        visit_count = visit_count_val,
        raffle_entries = FLOOR(visit_count_val/3),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_stats_on_visit ON visits;
CREATE TRIGGER update_stats_on_visit
    AFTER INSERT ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Fix existing user stats with correct raffle entry calculation
UPDATE user_stats SET raffle_entries = FLOOR(visit_count/3);
