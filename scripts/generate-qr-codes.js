const qr = require('qrcode');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Debug environment variables
console.log('Checking environment variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables!');
  console.log('\nMake sure to add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
  console.log('You can find this key in your Supabase dashboard under Project Settings > API.');
  process.exit(1);
}

console.log('\nInitializing Supabase client...');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

async function generateQRCodes() {
  try {
    console.log('\nFetching restaurants from database...');
    console.log('Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Test database connection first
    console.log('Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('restaurants')
      .select('count');

    if (testError) {
      console.error('Database connection test failed:', testError);
      throw testError;
    }
    console.log('Database connection successful!');
    
    // Fetch all restaurants
    console.log('\nQuerying restaurants table...');
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('name, code');

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('No restaurants found in the database.');
      console.log('This might be due to:');
      console.log('1. The restaurants table is empty');
      console.log('2. The query is not returning results due to RLS policies');
      console.log('3. The anon key does not have the correct permissions');
      return;
    }

    console.log(`Found ${restaurants.length} restaurants:`, restaurants.map(r => r.name));

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'qr-codes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
      console.log('\nCreated qr-codes directory.');
    }

    // Generate QR code for each restaurant
    for (const restaurant of restaurants) {
      const fileName = `${restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.png`;
      const filePath = path.join(outputDir, fileName);
      
      await qr.toFile(filePath, restaurant.code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      console.log(`Generated QR code for ${restaurant.name}: ${filePath}`);
    }

    console.log('\nAll QR codes have been generated in the qr-codes directory!');
  } catch (error) {
    console.error('\nError generating QR codes:', error);
    process.exit(1);
  }
}

generateQRCodes(); 