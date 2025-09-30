-- Development Database Data Import
-- This file contains only the essential data from your production backup
-- Safe to run on a fresh database after applying the schema

-- Clear existing data (if any)
DELETE FROM public.visits;
DELETE FROM public.user_stats; 
DELETE FROM public.restaurants;
DELETE FROM public.sponsors;

-- Import Restaurants Data
INSERT INTO public.restaurants (id, name, address, url, code, latitude, longitude, description, phone, specials, created_at, logo_file) VALUES
('e28e7383-d2f9-4233-a98e-9580bf10fc75', 'Crush & Grind', '7 Harper Ave', 'https://www.facebook.com/crushandgrindinc', 'CRUSHEDIT', 34.03470711, -77.89270565, 'Your local one stop shop for gourmet coffee, craft beer and high quality wine.', NULL, NULL, '2025-03-06 13:57:14.935301+00', NULL),
('d61f012f-4390-4b25-ad82-50c97bb0383e', 'Fudgeboat', '107 Carolina Beach Ave N', 'https://www.fudgeboat.com/', 'BUTTER', 34.0346523, -77.89267312, 'Delicious handmade butter and cream fudge and ice cream on the Boardwalk since 2004', NULL, NULL, '2025-03-06 13:57:14.935301+00', NULL),
('b8b92245-ccd6-420d-8670-9d8608740561', 'Michael''s Seafood', '1206 N Lake Park Blvd', 'https://mikescfood.com/', 'PEARLS', 34.04848208, -77.89849286, 'A Carolina Beach landmark. Fresh, never fried. Home of the 3 Time World Champion Seafood Chowder.', '(910) 458-7761', NULL, '2025-03-06 13:57:14.935301+00', NULL),
('63901325-9e90-43e2-8799-7805b973ac9f', 'Four Hounds Distillery', '1202 N Lake Park Blvd', 'https://fourhoundsdistilling.com/', 'WOOF', 34.04640099, -77.89798229, 'We are an NC based distillery focused on using local and all natural ingredients to produce craft rum', '(910) 945-0880', NULL, '2025-03-06 13:57:14.935301+00', NULL),
('569092bf-97c9-4311-a14d-4eec31416235', 'Seaworthy', '604 N Lake Park Blvd', 'https://seaworthycb.com/', 'RIGHTRED', 34.03890546, -77.89427506, 'Delicious, fresh and creative food and drinks in a warm and inviting dining room.', '(910) 636-3131', NULL, '2025-03-06 13:57:14.935301+00', NULL),
('83cced73-1545-405b-b438-b621f42c05f0', 'HopLite', '720 N Lake Park Blvd', 'https://hopliterestaurant.com/', 'GREEK', 34.04036836, -77.89497376, 'Pleasure Island''s best homemade Irish and American Pub Fare in a welcoming atmosphere with great service with plenty of Irish whiskey and beers on tap.', '(910) 458-4745', NULL, '2025-03-06 13:57:14.935301+00', NULL),
('7cae1c7a-0b31-4ce9-a13b-a537ff44d8cc', 'Neapolitan', '800 St Joseph St', 'https://www.neapolitan3.com/', '3GIRLS', 34.04051129, -77.89354566, 'Wine Bar, Tasting Room, Beer, Cider, and Seltzer Bottle Shop located in Carolina Beach, NC!', '(910) 600-6765', NULL, '2025-03-06 13:57:14.935301+00', NULL),
('ea7de680-ead7-495d-9fab-64b48cb6ee58', 'Havana''s', '1 N Lake Park Blvd', 'https://havanasrestaurant.com/', 'GARDEN', 34.03412566, -77.8944754, 'Your island restaurant with Fresh Seafood, Garden Salads, Hand Cut Angus Steaks, and a great wine selection! We specialize in awesome food & great service in a polished casual beach setting.', '(910) 458-2822', NULL, '2025-03-06 13:57:14.935301+00', NULL),
('6cee2915-bd7b-4ef7-bc4a-c0af98c35963', 'Shuckin'' Shack', '6 N Lake Park Blvd', 'https://www.theshuckinshack.com/location/carolina-beach/', 'GROUNDHOG', 34.03424702, -77.89381572, 'Specializing in Fresh Steamed and Raw Seafood (Oysters, Shrimp, Clams, Crab Legs, Mussells) Also Voted Best Wings on the Island', '(910) 458-7380', NULL, '2025-03-06 13:57:14.935301+00', NULL),
('68a1e3eb-a221-48e6-a8d9-3d0a2c5392ef', 'Malama Cafe', '108 Cape Fear Blvd', 'https://www.malamacafe.com/', 'HEAL', 34.03387486, -77.89358463, 'A cafe offering inspired sustainable healthy breakfast and lunch options and featuring Counter Culture Coffee', '(910) 707-5077', NULL, '2025-03-06 13:57:14.935301+00', NULL);

-- Import Sponsors Data  
INSERT INTO public.sponsors (id, name, address, phone, url, description, promo_offer, latitude, longitude, is_retail, created_at, logo_file) VALUES
('d46df31e-1f32-4167-b38b-8d31685cd118', 'Sea Creature Supplies & Rare Goods', '103 Charlotte Ave', NULL, 'https://seacreaturecb.com/', 'A curated collection of wellness products that we, ourselves, believe in and use, all in an intimate setting', NULL, 34.03239925, -77.89387038, true, '2025-03-06 13:58:48.622642+00', 'sea-creature.png'),
('cc6d49a8-1f1b-43cf-8d29-257bb715197f', 'Waveform Analytics', 'Wilmington, NC', NULL, 'https://waveformanalytics.com', 'Custom data analysis and visualizations', NULL, 0, 0, false, '2025-03-06 13:58:48.622642+00', 'waveform.png');

-- Note: user_stats and visits will be created as users interact with the app
-- No need to import test user data into dev environment