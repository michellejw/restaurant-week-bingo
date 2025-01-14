-- Add short_code column to restaurants table
ALTER TABLE restaurants ADD COLUMN short_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_restaurants_short_code ON restaurants(short_code);

-- Update existing restaurants with random 6-character codes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM restaurants WHERE short_code IS NULL
    LOOP
        -- Generate a random 6-character alphanumeric code
        -- Keep trying until we get a unique one
        WHILE TRUE LOOP
            BEGIN
                UPDATE restaurants 
                SET short_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))
                WHERE id = r.id;
                EXIT; -- If we get here, the update succeeded
            EXCEPTION WHEN unique_violation THEN
                -- If we get a duplicate, the loop will try again
            END;
        END LOOP;
    END LOOP;
END $$; 