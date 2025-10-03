#!/usr/bin/env node
/**
 * SPONSOR TEMPLATE GENERATOR
 * 
 * Generates XLSX templates for sponsor data collection
 * Usage: npm run sponsor:template
 */

const inquirer = require('inquirer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('🎯 SPONSOR TEMPLATE GENERATOR');
console.log('============================');

async function main() {
  try {
    // Get configuration from user
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Which environment should we use?',
        choices: [
          { name: '🧪 Development (safe for testing)', value: 'dev' },
          { name: '🚀 Production (live data)', value: 'prod' }
        ]
      },
      {
        type: 'list',
        name: 'templateType',
        message: 'What type of template do you want?',
        choices: [
          { name: '📝 Empty template (for new sponsor collection)', value: 'empty' },
          { name: '📊 Pre-filled template (current sponsors + empty rows)', value: 'prefilled' }
        ]
      },
      {
        type: 'input',
        name: 'eventName',
        message: 'Event name (for filename):',
        default: 'Fall-2025'
      }
    ]);

    // Load environment variables
    if (answers.environment === 'prod') {
      console.log('\n🚀 Using PRODUCTION environment');
      const prodEnv = fs.readFileSync('.env.production', 'utf8');
      const envVars = {};
      prodEnv.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
      Object.assign(process.env, envVars);
    } else {
      console.log('\n🧪 Using DEVELOPMENT environment');
      // Load dev environment from .env.local
      if (fs.existsSync('.env.local')) {
        const devEnv = fs.readFileSync('.env.local', 'utf8');
        const envVars = {};
        devEnv.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            envVars[key.trim()] = value.trim();
          }
        });
        Object.assign(process.env, envVars);
      }
    }

    // Create output directory
    const dataDir = path.join(process.cwd(), 'supabase', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let sponsors = [];
    
    if (answers.templateType === 'prefilled') {
      console.log('\n📊 Fetching current sponsors...');
      try {
        // Create supabase client
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        );
        
        const { data, error } = await supabase
          .from('sponsors')
          .select('*')
          .order('name');
          
        if (error) throw error;
        sponsors = data || [];
        console.log(`✅ Found ${sponsors.length} existing sponsors`);
      } catch (error) {
        console.log('⚠️  Could not fetch sponsors:', error.message);
        console.log('   Creating empty template instead');
      }
    }

    // Create the spreadsheet data
    const worksheetData = [];

    // Add headers
    worksheetData.push([
      'Name*',
      'Address*', 
      'Latitude*',
      'Longitude*',
      'Phone',
      'Website URL',
      'Description',
      'Promo Offer',
      'Is Retail (TRUE/FALSE)',
      'Logo Filename',
      'Notes'
    ]);

    // Add existing sponsors if prefilled
    if (answers.templateType === 'prefilled' && sponsors.length > 0) {
      sponsors.forEach(sponsor => {
        worksheetData.push([
          sponsor.name,
          sponsor.address,
          sponsor.latitude,
          sponsor.longitude,
          sponsor.phone || '',
          sponsor.url || '',
          sponsor.description || '',
          sponsor.promo_offer || '',
          sponsor.is_retail ? 'TRUE' : 'FALSE',
          sponsor.logo_file || '',
          '' // Notes column for updates
        ]);
      });
    }

    // Add example row for empty templates only (like restaurant template)
    if (answers.templateType === 'empty') {
      worksheetData.push([
        'Example Sponsor Co',
        '123 Carolina Beach Ave, Carolina Beach, NC',
        34.0335,
        -77.8925,
        '(910) 555-0123',
        'https://www.examplesponsor.com',
        'Local business supporting the community with quality services',
        '10% off with Restaurant Week receipt',
        'TRUE',
        'example-sponsor.png',
        'Remove this example row and add real sponsors'
      ]);
    }

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Main data sheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 30 }, // Address
      { wch: 12 }, // Latitude
      { wch: 12 }, // Longitude
      { wch: 15 }, // Phone
      { wch: 25 }, // Website
      { wch: 40 }, // Description
      { wch: 30 }, // Promo Offer
      { wch: 15 }, // Is Retail
      { wch: 20 }, // Logo Filename
      { wch: 30 }  // Notes
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sponsors');

    // Instructions sheet
    const instructions = [
      ['SPONSOR DATA COLLECTION INSTRUCTIONS'],
      [''],
      ['REQUIRED FIELDS (marked with *):'],
      ['• Name: Full sponsor business name'],
      ['• Address: Complete street address'],
      ['• Latitude: Decimal degrees (use Google Maps)'],
      ['• Longitude: Decimal degrees (use Google Maps)'],
      [''],
      ['OPTIONAL FIELDS:'],
      ['• Phone: Business phone number'],
      ['• Website URL: Full website (include https://)'],
      ['• Description: Brief description of the business'],
      ['• Promo Offer: Special offers or discounts'],
      ['• Is Retail: TRUE for retail stores, FALSE for others'],
      ['• Logo Filename: Name of logo file (e.g., "sponsor-name.png")'],
      ['• Notes: Any special notes or instructions'],
      [''],
      ['GETTING COORDINATES:'],
      ['1. Go to Google Maps'],
      ['2. Search for the business address'],
      ['3. Right-click on the location pin'],
      ['4. Click the coordinates that appear'],
      ['5. Copy the decimal numbers (e.g., 34.0335, -77.8925)'],
      [''],
      ['LOGO FILES:'],
      ['• Save logo files in PNG or JPG format'],
      ['• Name files using kebab-case (e.g., "sea-creature-supplies.png")'],
      ['• Keep files under 500KB for best performance'],
      ['• Files will be placed in /public/logos/ directory'],
      [''],
      ['RETAIL vs NON-RETAIL:'],
      ['• Retail sponsors (TRUE): Shops, stores, retail businesses'],
      ['• Non-retail sponsors (FALSE): Restaurants, services, organizations'],
      ['• This affects how they display on the map'],
      [''],
      ['SAVE AND RETURN:'],
      ['• Save this file when complete'],
      ['• Email or share the completed file'],
      ['• The import system will handle database updates']
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionSheet['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

    // Example data sheet
    const examples = [
      ['EXAMPLE SPONSOR DATA'],
      [''],
      ['Name*', 'Address*', 'Latitude*', 'Longitude*', 'Phone', 'Website URL', 'Description', 'Promo Offer', 'Is Retail', 'Logo Filename'],
      [
        'Sea Creature Supplies',
        '103 Charlotte Ave, Carolina Beach, NC',
        34.03239925,
        -77.89387038,
        '(910) 555-0123',
        'https://seacreaturecb.com',
        'Curated wellness products in an intimate setting',
        '10% off with Restaurant Week receipt',
        'TRUE',
        'sea-creature.png'
      ],
      [
        'Beach Analytics Co',
        '456 Ocean Blvd, Carolina Beach, NC', 
        34.0340,
        -77.8930,
        '',
        'https://beachanalytics.com',
        'Professional data analysis services',
        '',
        'FALSE',
        'beach-analytics.png'
      ]
    ];

    const exampleSheet = XLSX.utils.aoa_to_sheet(examples);
    exampleSheet['!cols'] = worksheet['!cols']; // Same column widths
    XLSX.utils.book_append_sheet(workbook, exampleSheet, 'Examples');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `sponsor-template-${answers.eventName}-${timestamp}.xlsx`;
    const filepath = path.join(dataDir, filename);

    // Write the file
    XLSX.writeFile(workbook, filepath);

    console.log('\n🎉 SUCCESS!');
    console.log('=============');
    console.log(`📁 Template created: ${filename}`);
    console.log(`📍 Location: supabase/data/`);
    console.log(`📊 Environment: ${answers.environment.toUpperCase()}`);
    console.log(`📝 Type: ${answers.templateType}`);
    
    if (answers.templateType === 'prefilled') {
      console.log(`📈 Current sponsors: ${sponsors.length}`);
      console.log(`✨ Ready for updates and additions`);
    } else {
      console.log(`📄 Includes example row for formatting guidance`);
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Share the template file with your chamber/data provider');
    console.log('2. They fill in sponsor information');
    console.log('3. Use "npm run sponsor:import" when you get it back');
    console.log('\n💡 TIP: The template includes instructions and examples!');

  } catch (error) {
    console.error('❌ Error generating template:', error);
    process.exit(1);
  }
}

main();