-- Modify the latitude and longitude columns to use double precision
ALTER TABLE restaurants
ALTER COLUMN latitude TYPE double precision,
ALTER COLUMN longitude TYPE double precision; 