const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

// Load environment configurations
function loadEnvironment(env) {
  const envFile = env === 'prod' ? '.env.production' : '.env.local';
  const envPath = path.join(__dirname, '..', envFile);
  
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envFile}`);
  }
  
  // Parse env file manually to avoid conflicts
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return envVars;
}

const DATABASES = {
  dev: {
    name: 'Development (.env.local)',
    envFile: '.env.local'
  },
  prod: {
    name: 'Production (.env.production)',
    envFile: '.env.production'
  }
};

async function generateRestaurantTemplate() {
  console.log('📋 Restaurant Data Template Generator');
  console.log('====================================\n');
  
  try {
    // Step 1: Ask what type of template
    const { templateType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateType',
        message: 'What type of template do you want to generate?',
        choices: [
          { name: 'Empty template (for new setup)', value: 'empty' },
          { name: 'Template with current restaurant data', value: 'current' }
        ]
      }
    ]);
    
    let database = null;
    
    // Step 2: If current data, ask which database
    if (templateType === 'current') {
      const { databaseChoice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'databaseChoice',
          message: 'Which database should I pull restaurant data from?',
          choices: [
            { name: DATABASES.dev.name, value: 'dev' },
            { name: DATABASES.prod.name, value: 'prod' }
          ]
        }
      ]);
      
      const databaseConfig = DATABASES[databaseChoice];
      
      // Load environment variables for the selected database
      try {
        const envVars = loadEnvironment(databaseChoice);
        database = {
          url: envVars.NEXT_PUBLIC_SUPABASE_URL,
          key: envVars.SUPABASE_SERVICE_ROLE_KEY,
          name: databaseConfig.name
        };
      } catch (error) {
        console.error(`❌ Error loading environment: ${error.message}`);
        console.log(`\n💡 Make sure ${databaseConfig.envFile} exists with your credentials`);
        return;
      }
      
      // Step 3: Confirm the choice
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Generate template using ${database.name}?`,
          default: true
        }
      ]);
      
      if (!confirm) {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    // Generate the template
    const workbook = XLSX.utils.book_new();
    
    // Create instructions sheet
    createInstructionsSheet(workbook);
    
    // Create restaurants sheet
    if (templateType === 'empty') {
      createEmptyRestaurantsSheet(workbook);
    } else {
      await createCurrentRestaurantsSheet(workbook, database);
    }
    
    // Save the file
    const timestamp = new Date().toISOString().split('T')[0];
    let fileName;
    if (templateType === 'empty') {
      fileName = `restaurant-template-${timestamp}.xlsx`;
    } else {
      const envType = database.name.includes('Production') ? 'prod' : 'dev';
      fileName = `restaurant-current-data-${envType}-${timestamp}.xlsx`;
    }
    
    const outputPath = path.join(__dirname, '../supabase/data', fileName);
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`\n✅ Template generated: ${fileName}`);
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
  if (worksheet['A1']) {
    worksheet['A1'].s = {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: "FF5436" } },
      alignment: { horizontal: 'center' }
    };
  }
  
  // Set column widths
  worksheet['!cols'] = [{ width: 80 }];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'INSTRUCTIONS');
}

function createEmptyRestaurantsSheet(workbook) {
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

async function createCurrentRestaurantsSheet(workbook, database) {
  console.log(`📋 Creating sheet with current data from ${database.name}...`);
  console.log(`📡 Connecting to: ${database.url}\n`);
  
  const supabase = createClient(database.url, database.key);
  
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