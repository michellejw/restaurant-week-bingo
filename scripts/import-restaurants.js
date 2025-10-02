const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function importRestaurants() {
  const mode = process.argv[2]; // --preview, --backup, or --import
  
  console.log('🍴 Restaurant Data Import Tool');
  console.log('==============================\n');
  
  if (!mode) {
    console.log('Usage:');
    console.log('  node scripts/import-restaurants.js --preview   # Preview data without changes');
    console.log('  node scripts/import-restaurants.js --backup    # Create backup of current data');
    console.log('  node scripts/import-restaurants.js --import    # Import new data (after preview & backup)');
    return;
  }
  
  try {
    if (mode === '--backup') {
      await createBackup();
    } else if (mode === '--preview') {
      await previewImport();
    } else if (mode === '--import') {
      await performImport();
    } else {
      console.log('❌ Invalid mode. Use --preview, --backup, or --import');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function createBackup() {
  console.log('💾 Creating backup of current restaurant data...\n');
  
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name');
  
  if (error) throw error;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, `../supabase/data/restaurants-backup-${timestamp}.json`);
  
  fs.writeFileSync(backupFile, JSON.stringify(restaurants, null, 2));
  
  console.log(`✅ Backup created: ${backupFile}`);
  console.log(`📊 Backed up ${restaurants.length} restaurants\n`);
  
  // Also show current restaurant names for comparison
  console.log('📋 Current restaurants in database:');
  restaurants.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name} (${r.code})`);
  });
}

async function previewImport() {
  console.log('👀 Previewing import data...\n');
  
  const newData = parseXLSXData();
  const { data: currentData } = await supabase.from('restaurants').select('*');
  
  console.log(`📊 Current database: ${currentData?.length || 0} restaurants`);
  console.log(`📊 New XLSX data: ${newData.length} restaurants\n`);
  
  console.log('🆕 Restaurants in new data:');
  newData.forEach((restaurant, i) => {
    const existing = currentData?.find(r => r.name === restaurant.name || r.code === restaurant.code);
    const status = existing ? '🔄 UPDATE' : '✨ NEW';
    console.log(`   ${i + 1}. ${status} ${restaurant.name} (${restaurant.code})`);
    
    if (restaurant.specials) {
      console.log(`      🎁 Promotion: ${restaurant.specials.substring(0, 80)}${restaurant.specials.length > 80 ? '...' : ''}`);
    }
  });
  
  // Check for restaurants that will be removed
  const removedRestaurants = currentData?.filter(current => 
    !newData.find(newR => newR.name === current.name || newR.code === current.code)
  ) || [];
  
  if (removedRestaurants.length > 0) {
    console.log('\n❌ Restaurants that will be REMOVED:');
    removedRestaurants.forEach(r => {
      console.log(`   • ${r.name} (${r.code})`);
    });
  }
  
  console.log('\n📝 Sample new restaurant data:');
  console.log(JSON.stringify(newData[0], null, 2));
  
  console.log('\n⚠️  Next steps:');
  console.log('   1. Run --backup to create a backup');
  console.log('   2. Run --import to perform the actual import');
}

async function performImport() {
  console.log('🚀 Performing import...\n');
  
  // Safety check - ensure backup exists
  const backupFiles = fs.readdirSync(path.join(__dirname, '../supabase/data/'))
    .filter(f => f.startsWith('restaurants-backup-'));
  
  if (backupFiles.length === 0) {
    console.log('⚠️  No backup found. Please run --backup first for safety.');
    return;
  }
  
  const newData = parseXLSXData();
  
  // Clear existing data (we're doing a full replace)
  console.log('🗑️  Clearing existing restaurant data...');
  const { error: deleteError } = await supabase
    .from('restaurants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) throw deleteError;
  
  // Insert new data
  console.log('📥 Inserting new restaurant data...');
  const { data: inserted, error: insertError } = await supabase
    .from('restaurants')
    .insert(newData)
    .select();
  
  if (insertError) throw insertError;
  
  console.log(`✅ Successfully imported ${inserted.length} restaurants`);
  
  // Show summary
  console.log('\n📊 Import Summary:');
  console.log(`   • Total restaurants: ${inserted.length}`);
  console.log(`   • With promotions: ${inserted.filter(r => r.specials).length}`);
  console.log(`   • With phone numbers: ${inserted.filter(r => r.phone).length}`);
}

function parseXLSXData() {
  const filePath = path.join(__dirname, '../supabase/data/Rest Tour Database Oct 2025.xlsx');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets['MARCH RW 2025'];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Data starts from row 5 (index 4), headers at row 4 (index 3)
  const headerRow = jsonData[3];
  const dataRows = jsonData.slice(4);
  
  const restaurants = [];
  
  dataRows.forEach(row => {
    // Skip empty rows
    if (!row[0]) return;
    
    const restaurant = {
      name: row[0]?.trim(),
      address: row[1]?.trim(),
      url: row[2]?.trim() || null,
      code: row[3]?.trim().toUpperCase(),
      latitude: parseFloat(row[4]),
      longitude: parseFloat(row[5]),
      description: row[6]?.trim() || null,
      phone: row[8]?.trim() || null, // Column I
      specials: null // Will be filled in separately with actual promotions
    };
    
    // Validate required fields
    if (restaurant.name && restaurant.code && restaurant.latitude && restaurant.longitude) {
      restaurants.push(restaurant);
    }
  });
  
  return restaurants;
}

importRestaurants();
