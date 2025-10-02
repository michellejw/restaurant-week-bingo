const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateRestaurantTemplate() {
  const mode = process.argv[2]; // --template (empty) or --current (with current data)
  
  console.log('📋 Restaurant Data Template Generator');
  console.log('====================================\n');
  
  if (!mode || !['--template', '--current'].includes(mode)) {
    console.log('Usage:');
    console.log('  node scripts/generate-restaurant-template.js --template   # Empty template');
    console.log('  node scripts/generate-restaurant-template.js --current    # Template with current data');
    return;
  }
  
  // Show which database we're using for transparency
  if (mode === '--current') {
    const isDev = process.env.NEXT_PUBLIC_SUPABASE_URL.includes('lhynosiqalkouyotibwt');
    const dbType = isDev ? 'DEVELOPMENT' : 'PRODUCTION';
    console.log(`📡 Using ${dbType} database`);
    console.log(`🔗 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
  }
  
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create instructions sheet
    createInstructionsSheet(workbook);
    
    // Create restaurants sheet
    if (mode === '--template') {
      await createEmptyRestaurantsSheet(workbook);
    } else {
      await createCurrentRestaurantsSheet(workbook);
    }
    
    // No sample sheet needed
    
    // Save the file
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = mode === '--template' 
      ? `restaurant-template-${timestamp}.xlsx`
      : `restaurant-current-data-${timestamp}.xlsx`;
    
    const outputPath = path.join(__dirname, '../supabase/data', fileName);
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`✅ Template generated: ${fileName}`);
    console.log(`📁 Location: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function createInstructionsSheet(workbook) {
  console.log('📝 Creating instructions sheet...');
  
  const instructions = [
    ['RESTAURANT WEEK BINGO - RESTAURANT DATA UPDATE'],
    [''],
    ['INSTRUCTIONS:'],
    [''],
    ['1. UPDATE EXISTING RESTAURANTS:'],
    ['   - Do NOT change the NAME or CODE columns for existing restaurants'],
    ['   - Update address, phone, description, or promotions as needed'],
    ['   - Leave coordinates (latitude/longitude) unchanged unless restaurant moved'],
    [''],
    ['2. ADD NEW RESTAURANTS:'],
    ['   - Add new restaurants at the bottom of the list'],
    ['   - Each restaurant MUST have: Name, Address, Code'],
    ['   - Code must be UNIQUE and ALL CAPS (e.g., "NEWCODE2025")'],
    ['   - Latitude/Longitude will be looked up if left blank'],
    [''],
    ['3. PROMOTIONS COLUMN:'],
    ['   - Add specific promotional offers (see example below)'],
    ['   - Leave blank if no promotions available'],
    ['   - Enter text directly - do NOT include quotation marks'],
    ['   - Be specific about the offer and any conditions'],
    [''],
    ['4. SAVE AND RETURN:'],
    ['   - Save as .xlsx format'],
    ['   - Email back the completed file'],
    [''],
    ['5. COLUMNS EXPLAINED:'],
    ['   - NAME: Restaurant name as it appears to customers'],
    ['   - ADDRESS: Full street address'],
    ['   - URL: Website or Facebook page (optional)'],
    ['   - CODE: Unique check-in code (ALL CAPS, no spaces)'],
    ['   - LATITUDE/LONGITUDE: GPS coordinates (can leave blank for new restaurants)'],
    ['   - DESCRIPTION: What makes this restaurant special'],
    ['   - PHONE: Contact phone number'],
    ['   - PROMOTIONS: Restaurant Week specials (e.g. 20% off appetizers)'],
    [''],
    ['Questions? Contact the web developer through the chamber.'],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(instructions);
  
  // Style the header
  worksheet['A1'].s = {
    font: { bold: true, sz: 14 },
    fill: { fgColor: { rgb: "FF5436" } },
    alignment: { horizontal: 'center' }
  };
  
  // Set column widths
  worksheet['!cols'] = [{ width: 80 }];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'INSTRUCTIONS');
}

async function createEmptyRestaurantsSheet(workbook) {
  console.log('📋 Creating empty template sheet...');
  
  const headers = [
    'NAME',
    'ADDRESS', 
    'URL',
    'CODE',
    'LATITUDE',
    'LONGITUDE',
    'DESCRIPTION',
    'PHONE',
    'PROMOTIONS'
  ];
  
  const data = [headers];
  
  // Add one clear example row
  data.push([
    'Example Restaurant',
    '123 Carolina Beach Ave',
    'https://www.examplerestaurant.com',
    'EXAMPLE2025',
    '34.0347',
    '-77.8927',
    'Fresh seafood and steaks with ocean views',
    '(910) 555-0123',
    '20% off appetizers with dinner purchase'
  ]);
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { width: 25 }, // NAME
    { width: 30 }, // ADDRESS
    { width: 35 }, // URL
    { width: 15 }, // CODE
    { width: 12 }, // LATITUDE
    { width: 12 }, // LONGITUDE
    { width: 50 }, // DESCRIPTION
    { width: 15 }, // PHONE
    { width: 40 }  // PROMOTIONS
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'RESTAURANTS');
}

async function createCurrentRestaurantsSheet(workbook) {
  console.log('📋 Creating sheet with current data...');
  
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name');
  
  if (error) throw error;
  
  const headers = [
    'NAME',
    'ADDRESS',
    'URL', 
    'CODE',
    'LATITUDE',
    'LONGITUDE',
    'DESCRIPTION',
    'PHONE',
    'PROMOTIONS'
  ];
  
  const data = [headers];
  
  restaurants.forEach(restaurant => {
    data.push([
      restaurant.name,
      restaurant.address,
      restaurant.url || '',
      restaurant.code,
      restaurant.latitude,
      restaurant.longitude,
      restaurant.description || '',
      restaurant.phone || '',
      restaurant.specials || ''
    ]);
  });
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { width: 25 }, // NAME
    { width: 30 }, // ADDRESS  
    { width: 35 }, // URL
    { width: 15 }, // CODE
    { width: 12 }, // LATITUDE
    { width: 12 }, // LONGITUDE
    { width: 50 }, // DESCRIPTION
    { width: 15 }, // PHONE
    { width: 40 }  // PROMOTIONS
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'RESTAURANTS');
  
  console.log(`📊 Added ${restaurants.length} current restaurants`);
}

generateRestaurantTemplate();
