-- Drop the QR code index if it exists
DROP INDEX IF EXISTS restaurants_qr_code_idx;

-- Remove the QR code column from restaurants table
ALTER TABLE restaurants DROP COLUMN IF EXISTS qr_code; 