#!/usr/bin/env node
/**
 * SMART SPONSOR IMPORT SYSTEM
 * 
 * Safely imports sponsor data with intelligent fuzzy matching
 * Usage: npm run sponsor:import
 */

const inquirer = require('inquirer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 SMART SPONSOR IMPORT SYSTEM');
console.log('==============================');

// Simple fuzzy matching function
function fuzzyMatch(str1, str2, threshold = 0.8) {
  if (!str1 || !str2) return false;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return true;
  
  // Calculate simple similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return true;
  
  const editDistance = levenshtein(longer, shorter);
  const similarity = (longer.length - editDistance) / longer.length;
  
  return similarity >= threshold;
}

function levenshtein(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function backupDatabase(environment) {
  console.log(`\n💾 Creating backup of ${environment} database...`);
  
  try {
    const backupScript = environment === 'prod' ? 'npm run backup:prod' : 'npm run backup';
    execSync(backupScript, { stdio: 'inherit' });
    console.log('✅ Database backup completed');
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

async function findDataFiles() {
  const dataDir = path.join(process.cwd(), 'supabase', 'data');
  
  if (!fs.existsSync(dataDir)) {
    throw new Error('No supabase/data directory found. Run sponsor template generator first.');
  }
  
  const files = fs.readdirSync(dataDir)
    .filter(file => file.includes('sponsor') && file.endsWith('.xlsx'))
    .map(file => ({
      name: file,
      path: path.join(dataDir, file),
      stats: fs.statSync(path.join(dataDir, file))
    }))
    .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
  return files;
}

async function readSpreadsheet(filePath) {
  console.log('📖 Reading spreadsheet...');
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase() === 'sponsors' || name.toLowerCase().includes('sponsor')
  ) || workbook.SheetNames[0];
  
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (rawData.length < 2) {
    throw new Error('Spreadsheet appears to be empty or has no data rows');
  }
  
  // Find header row
  const headers = rawData[0];
  const dataRows = rawData.slice(1);
  
  // Map column names to indexes (flexible matching)
  const columnMap = {};
  headers.forEach((header, index) => {
    const h = header.toString().toLowerCase();
    if (h.includes('name')) columnMap.name = index;
    else if (h.includes('address')) columnMap.address = index;
    else if (h.includes('lat')) columnMap.latitude = index;
    else if (h.includes('long') || h.includes('lng')) columnMap.longitude = index;
    else if (h.includes('phone')) columnMap.phone = index;
    else if (h.includes('url') || h.includes('website')) columnMap.url = index;
    else if (h.includes('desc')) columnMap.description = index;
    else if (h.includes('promo') || h.includes('offer')) columnMap.promo_offer = index;
    else if (h.includes('retail')) columnMap.is_retail = index;
    else if (h.includes('logo') || h.includes('file')) columnMap.logo_file = index;
  });
  
  // Validate required columns
  const required = ['name', 'address', 'latitude', 'longitude'];
  const missing = required.filter(col => columnMap[col] === undefined);
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }
  
  // Parse data rows
  const sponsors = [];
  const errors = [];
  
  dataRows.forEach((row, index) => {
    const rowNum = index + 2; // Account for header + 0-based indexing
    
    // Skip empty rows
    if (!row[columnMap.name] || row[columnMap.name].toString().trim() === '') {
      return;
    }
    
    try {
      const sponsor = {
        name: row[columnMap.name]?.toString().trim(),
        address: row[columnMap.address]?.toString().trim(),
        latitude: parseFloat(row[columnMap.latitude]),
        longitude: parseFloat(row[columnMap.longitude]),
        phone: row[columnMap.phone]?.toString().trim() || null,
        url: row[columnMap.url]?.toString().trim() || null,
        description: row[columnMap.description]?.toString().trim() || null,
        promo_offer: row[columnMap.promo_offer]?.toString().trim() || null,
        is_retail: row[columnMap.is_retail]?.toString().toLowerCase().includes('true') || false,
        logo_file: row[columnMap.logo_file]?.toString().trim() || null
      };
      
      // Validate required fields
      if (!sponsor.name || !sponsor.address) {
        errors.push(`Row ${rowNum}: Missing name or address`);
        return;
      }
      
      if (isNaN(sponsor.latitude) || isNaN(sponsor.longitude)) {
        errors.push(`Row ${rowNum}: Invalid coordinates for "${sponsor.name}"`);
        return;
      }
      
      // Clean up URL
      if (sponsor.url && !sponsor.url.startsWith('http')) {
        sponsor.url = 'https://' + sponsor.url;
      }
      
      sponsors.push({ ...sponsor, _rowNumber: rowNum });
      
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error.message}`);
    }
  });
  
  return { sponsors, errors };
}

async function findConflicts(newSponsors, existingSponsors) {
  console.log('🔍 Checking for conflicts...');
  
  const conflicts = [];
  const additions = [];
  
  newSponsors.forEach(newSponsor => {
    const matches = existingSponsors.filter(existing => 
      fuzzyMatch(existing.name, newSponsor.name, 0.8)
    );
    
    if (matches.length > 0) {
      conflicts.push({
        newSponsor,
        matches,
        action: 'conflict'
      });
    } else {
      additions.push({
        newSponsor,
        action: 'add'
      });
    }
  });
  
  return { conflicts, additions };
}

async function resolveConflicts(conflicts) {
  if (conflicts.length === 0) return [];
  
  console.log(`\n⚠️  Found ${conflicts.length} potential conflicts`);
  console.log('Please resolve each conflict:\n');
  
  const resolutions = [];
  
  for (const conflict of conflicts) {
    const { newSponsor, matches } = conflict;
    
    console.log(`🔄 CONFLICT: "${newSponsor.name}"`);
    console.log(`   New data: ${newSponsor.address}`);
    matches.forEach((match, i) => {
      console.log(`   Existing ${i + 1}: "${match.name}" at ${match.address}`);
    });
    
    const choices = [
      { name: `➕ Add as new sponsor (keep both)`, value: 'add' },
      { name: `🔄 Update existing sponsor data`, value: 'update' },
      { name: `⏭️  Skip this sponsor`, value: 'skip' }
    ];
    
    if (matches.length > 1) {
      matches.forEach((match, i) => {
        choices.splice(-1, 0, {
          name: `🔄 Update existing #${i + 1}: "${match.name}"`,
          value: `update_${i}`
        });
      });
    }
    
    const answer = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: `What should we do with "${newSponsor.name}"?`,
      choices
    }]);
    
    if (answer.action === 'add') {
      resolutions.push({ sponsor: newSponsor, action: 'add' });
    } else if (answer.action === 'update') {
      resolutions.push({ 
        sponsor: newSponsor, 
        action: 'update', 
        existingId: matches[0].id 
      });
    } else if (answer.action.startsWith('update_')) {
      const index = parseInt(answer.action.split('_')[1]);
      resolutions.push({ 
        sponsor: newSponsor, 
        action: 'update', 
        existingId: matches[index].id 
      });
    }
    // Skip action means don't add to resolutions
    
    console.log(''); // Empty line for readability
  }
  
  return resolutions;
}

async function executeImport(resolutions, additions, environment) {
  console.log('\n🚀 Executing import...');
  
  // Set environment variables
  if (environment === 'prod') {
    const prodEnv = fs.readFileSync('.env.production', 'utf8');
    const envVars = {};
    prodEnv.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    Object.assign(process.env, envVars);
  }
  
  const { supabase } = require('../src/lib/supabase');
  
  let addCount = 0;
  let updateCount = 0;
  const errors = [];
  
  // Process additions (no conflicts)
  for (const addition of additions) {
    try {
      const { _rowNumber, ...sponsorData } = addition.newSponsor;
      const response = await supabase
        .from('sponsors')
        .insert([sponsorData])
        .select()
        .single();
        
      if (response.error) throw response.error;
      addCount++;
      console.log(`✅ Added: ${sponsorData.name}`);
    } catch (error) {
      errors.push(`Failed to add "${addition.newSponsor.name}": ${error.message}`);
    }
  }
  
  // Process resolutions (conflicts)
  for (const resolution of resolutions) {
    try {
      const { _rowNumber, ...sponsorData } = resolution.sponsor;
      
      if (resolution.action === 'add') {
        const response = await supabase
          .from('sponsors')
          .insert([sponsorData])
          .select()
          .single();
          
        if (response.error) throw response.error;
        addCount++;
        console.log(`✅ Added: ${sponsorData.name}`);
      } else if (resolution.action === 'update') {
        const response = await supabase
          .from('sponsors')
          .update(sponsorData)
          .eq('id', resolution.existingId)
          .select()
          .single();
          
        if (response.error) throw response.error;
        updateCount++;
        console.log(`🔄 Updated: ${sponsorData.name}`);
      }
    } catch (error) {
      errors.push(`Failed to ${resolution.action} "${resolution.sponsor.name}": ${error.message}`);
    }
  }
  
  return { addCount, updateCount, errors };
}

async function main() {
  try {
    // Step 1: Choose environment and file
    const dataFiles = await findDataFiles();
    
    if (dataFiles.length === 0) {
      throw new Error('No sponsor spreadsheet files found. Run "npm run sponsor:template" first.');
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Which environment should we import to?',
        choices: [
          { name: '🧪 Development (safe for testing)', value: 'dev' },
          { name: '🚀 Production (live data)', value: 'prod' }
        ]
      },
      {
        type: 'list',
        name: 'file',
        message: 'Which sponsor file should we import?',
        choices: dataFiles.map(file => ({
          name: `${file.name} (${file.stats.mtime.toLocaleDateString()})`,
          value: file.path
        }))
      },
      {
        type: 'confirm',
        name: 'backup',
        message: 'Create database backup before import?',
        default: true
      }
    ]);
    
    // Step 2: Create backup
    if (answers.backup) {
      await backupDatabase(answers.environment);
    }
    
    // Step 3: Read and validate spreadsheet
    const { sponsors: newSponsors, errors } = await readSpreadsheet(answers.file);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Spreadsheet validation errors:');
      errors.forEach(error => console.log(`   ${error}`));
      
      const proceed = await inquirer.prompt([{
        type: 'confirm',
        name: 'continue',
        message: 'Continue with valid rows?',
        default: false
      }]);
      
      if (!proceed.continue) {
        console.log('Import cancelled. Please fix the spreadsheet and try again.');
        return;
      }
    }
    
    if (newSponsors.length === 0) {
      throw new Error('No valid sponsor data found in spreadsheet');
    }
    
    console.log(`📊 Found ${newSponsors.length} valid sponsors to import`);
    
    // Step 4: Get existing sponsors and find conflicts
    console.log(`\n📡 Connecting to ${answers.environment} database...`);
    
    // Set environment for database connection
    if (answers.environment === 'prod') {
      const prodEnv = fs.readFileSync('.env.production', 'utf8');
      const envVars = {};
      prodEnv.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
      Object.assign(process.env, envVars);
    }
    
    const { DatabaseService } = require('../src/lib/services/database');
    const existingSponsors = await DatabaseService.sponsors.getAll();
    console.log(`📈 Found ${existingSponsors.length} existing sponsors`);
    
    const { conflicts, additions } = await findConflicts(newSponsors, existingSponsors);
    
    console.log(`\n📋 Import Summary:`);
    console.log(`   New sponsors to add: ${additions.length}`);
    console.log(`   Potential conflicts: ${conflicts.length}`);
    
    // Step 5: Resolve conflicts
    const resolutions = await resolveConflicts(conflicts);
    
    // Step 6: Final confirmation
    const totalChanges = additions.length + resolutions.length;
    
    if (totalChanges === 0) {
      console.log('\n🤷 No changes to import. All done!');
      return;
    }
    
    const finalConfirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: `Ready to import ${totalChanges} sponsors to ${answers.environment}?`,
      default: true
    }]);
    
    if (!finalConfirm.proceed) {
      console.log('Import cancelled.');
      return;
    }
    
    // Step 7: Execute import
    const { addCount, updateCount, errors: importErrors } = await executeImport(resolutions, additions, answers.environment);
    
    // Step 8: Summary
    console.log('\n🎉 IMPORT COMPLETE!');
    console.log('===================');
    console.log(`✅ Sponsors added: ${addCount}`);
    console.log(`🔄 Sponsors updated: ${updateCount}`);
    
    if (importErrors.length > 0) {
      console.log(`❌ Errors: ${importErrors.length}`);
      importErrors.forEach(error => console.log(`   ${error}`));
    }
    
    console.log(`\n🔗 Database: ${answers.environment.toUpperCase()}`);
    console.log('✨ Your sponsors are ready!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

main();