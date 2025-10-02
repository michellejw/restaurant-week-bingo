#!/usr/bin/env node

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

// Fuzzy matching functions
function levenshteinDistance(str1, str2) {
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function similarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLen - distance) / maxLen;
}

function normalizeRestaurantName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

function findPotentialMatches(newRestaurant, existingRestaurants, threshold = 0.65) {
  const matches = [];
  const newNameNormalized = normalizeRestaurantName(newRestaurant.name);
  
  for (const existing of existingRestaurants) {
    const existingNameNormalized = normalizeRestaurantName(existing.name);
    
    // Calculate similarity - FIXED: exact match should use original names
    const exactMatch = newRestaurant.name.trim().toLowerCase() === existing.name.trim().toLowerCase();
    const stringSimilarity = similarity(newNameNormalized, existingNameNormalized);
    
    // Check for common abbreviations
    let abbreviationBonus = 0;
    if ((newNameNormalized.includes('co') && existingNameNormalized.includes('company')) ||
        (existingNameNormalized.includes('co') && newNameNormalized.includes('company'))) {
      abbreviationBonus = 0.1;
    }
    
    const combinedScore = Math.min(1.0, stringSimilarity + abbreviationBonus);
    
    if (exactMatch || combinedScore >= threshold) {
      matches.push({
        restaurant: existing,
        exactMatch,
        similarity: combinedScore,
        confidence: exactMatch ? 'HIGH' : combinedScore > 0.85 ? 'MEDIUM' : 'LOW'
      });
    }
  }
  
  return matches.sort((a, b) => {
    if (a.exactMatch && !b.exactMatch) return -1;
    if (!a.exactMatch && b.exactMatch) return 1;
    return b.similarity - a.similarity;
  });
}

// Load environment configurations
function loadEnvironment(env) {
  const envFile = env === 'prod' ? '.env.production' : '.env.local';
  const envPath = path.join(__dirname, '..', envFile);
  
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envFile}`);
  }
  
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

class SmartImporter {
  constructor() {
    this.supabase = null;
    this.environment = null;
  }

  async initialize() {
    console.log('🍴 Smart Restaurant Import Tool\n');
    
    // Choose environment
    const { environment } = await inquirer.prompt([{
      type: 'list',
      name: 'environment',
      message: 'Which database would you like to import to?',
      choices: [
        { name: '🧪 Development (safe for testing)', value: 'dev' },
        { name: '🚀 Production (live data - be careful!)', value: 'prod' }
      ]
    }]);
    
    this.environment = environment;
    
    // Load environment
    const envVars = loadEnvironment(environment);
    this.supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log(`\n📡 Connected to ${environment === 'prod' ? 'PRODUCTION' : 'DEVELOPMENT'} database\n`);
  }

  async selectFile() {
    const dataDir = path.join(__dirname, '..', 'supabase', 'data');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.xlsx'));
    
    if (files.length === 0) {
      console.log('❌ No XLSX files found in supabase/data/');
      process.exit(1);
    }
    
    if (files.length === 1) {
      console.log(`📁 Using file: ${files[0]}\n`);
      return path.join(dataDir, files[0]);
    }
    
    const choices = files.map(file => {
      const stats = fs.statSync(path.join(dataDir, file));
      return {
        name: `${file} (modified ${stats.mtime.toLocaleDateString()} ${stats.mtime.toLocaleTimeString()})`,
        value: path.join(dataDir, file)
      };
    });
    
    const { selectedFile } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedFile',
      message: 'Which file would you like to import?',
      choices
    }]);
    
    console.log('');
    return selectedFile;
  }

  async createBackup() {
    console.log('💾 Creating automatic backup...');
    
    const [restaurants, visits, userStats] = await Promise.all([
      this.supabase.from('restaurants').select('*').then(r => r.data || []),
      this.supabase.from('visits').select('*').then(r => r.data || []),
      this.supabase.from('user_stats').select('*').then(r => r.data || [])
    ]);
    
    const backupData = {
      environment: this.environment,
      restaurants,
      visits,
      userStats,
      timestamp: new Date().toISOString()
    };
    
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const backupFile = path.join(backupsDir, 
      `${this.environment}-pre-import-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`
    );
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`   ✅ Backup saved: ${path.basename(backupFile)}\n`);
    
    return backupFile;
  }

  async parseRestaurantData(filePath) {
    const workbook = XLSX.readFile(filePath);
    
    // Find the right sheet
    const sheetNames = workbook.SheetNames;
    let targetSheet = null;
    
    for (const sheetName of sheetNames) {
      if (sheetName.toLowerCase().includes('march') || 
          sheetName.toLowerCase().includes('restaurant') ||
          sheetName.toLowerCase().includes('2025')) {
        targetSheet = sheetName;
        break;
      }
    }
    
    if (!targetSheet) {
      targetSheet = sheetNames[0];
    }
    
    console.log(`📊 Reading sheet: "${targetSheet}"`);
    
    const worksheet = workbook.Sheets[targetSheet];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some(cell => 
        typeof cell === 'string' && cell.toUpperCase() === 'NAME'
      )) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not find header row with NAME column');
    }
    
    const restaurants = [];
    
    // Parse restaurant data
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;
      
      const restaurant = {
        name: row[0]?.toString()?.trim(),
        address: row[1]?.toString()?.trim(),
        url: row[2]?.toString()?.trim() || null,
        code: row[3]?.toString()?.trim(),
        latitude: parseFloat(row[4]),
        longitude: parseFloat(row[5]),
        description: row[6]?.toString()?.trim() || null,
        phone: row[8]?.toString()?.trim() || null,
        specials: row[13]?.toString()?.trim() || null
      };
      
      // Validate required fields
      if (!restaurant.name || !restaurant.code || 
          isNaN(restaurant.latitude) || isNaN(restaurant.longitude)) {
        console.log(`⚠️  Skipping invalid row ${i + 1}: missing required data`);
        continue;
      }
      
      restaurants.push(restaurant);
    }
    
    console.log(`   Found ${restaurants.length} restaurants`);
    
    // Check for duplicates in the input file
    const duplicates = [];
    const seen = new Map();
    
    restaurants.forEach((restaurant, index) => {
      const key = `${restaurant.name.toLowerCase()}-${restaurant.code.toLowerCase()}`;
      if (seen.has(key)) {
        duplicates.push({
          restaurant,
          originalIndex: seen.get(key),
          duplicateIndex: index
        });
      } else {
        seen.set(key, index);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${duplicates.length} duplicate(s) in input file:`);
      duplicates.forEach(dup => {
        console.log(`   • "${dup.restaurant.name}" (${dup.restaurant.code}) appears multiple times`);
      });
      console.log('   Only the first occurrence will be processed.\n');
      
      // Remove duplicates
      const uniqueRestaurants = [];
      const uniqueKeys = new Set();
      
      restaurants.forEach(restaurant => {
        const key = `${restaurant.name.toLowerCase()}-${restaurant.code.toLowerCase()}`;
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key);
          uniqueRestaurants.push(restaurant);
        }
      });
      
      return uniqueRestaurants;
    }
    
    console.log('');
    return restaurants;
  }

  async processMatches(newRestaurants, existingRestaurants) {
    const results = {
      toUpdate: [],
      toAdd: [],
      toRemove: []
    };
    
    console.log('🔍 Processing restaurant matches...\n');
    
    for (const newRestaurant of newRestaurants) {
      const potentialMatches = findPotentialMatches(newRestaurant, existingRestaurants);
      
      if (potentialMatches.length === 0) {
        // No matches - this is a new restaurant
        results.toAdd.push(newRestaurant);
        console.log(`✨ NEW: "${newRestaurant.name}" - will be added`);
        continue;
      }
      
      // Show the restaurant and potential matches
      console.log(`\n📍 NEW RESTAURANT: "${newRestaurant.name}"`);
      console.log(`   Address: ${newRestaurant.address}`);
      console.log(`   Code: ${newRestaurant.code}`);
      if (newRestaurant.specials) {
        console.log(`   Specials: ${newRestaurant.specials}`);
      }
      
      if (potentialMatches[0].exactMatch) {
        // Exact match - auto-update
        console.log(`   ✅ Exact match found: "${potentialMatches[0].restaurant.name}"`);
        console.log('   → Will update existing restaurant\n');
        results.toUpdate.push({ existing: potentialMatches[0].restaurant, new: newRestaurant });
        continue;
      }
      
      // Show potential matches
      console.log('   🤔 Found similar restaurants:');
      potentialMatches.forEach((match, index) => {
        const label = String.fromCharCode(65 + index); // A, B, C, etc.
        console.log(`   ${label}. "${match.restaurant.name}" (existing) - ${match.confidence} confidence`);
        console.log(`      Address: ${match.restaurant.address}`);
        console.log(`      Code: ${match.restaurant.code}`);
      });
      
      const newLabel = String.fromCharCode(65 + potentialMatches.length);
      console.log(`   ${newLabel}. "${newRestaurant.name}" (from file)`);
      console.log(`      Address: ${newRestaurant.address}`);
      console.log(`      Code: ${newRestaurant.code}`);
      
      // Create checkbox choices
      const choices = [
        ...potentialMatches.map((match, index) => ({
          name: `${String.fromCharCode(65 + index)}. "${match.restaurant.name}" (existing)`,
          value: `existing-${match.restaurant.id}`,
          checked: false
        })),
        {
          name: `${String.fromCharCode(65 + potentialMatches.length)}. "${newRestaurant.name}" (from file)`,
          value: `new-${JSON.stringify(newRestaurant)}`,
          checked: false
        }
      ];
      
      const { selectedRestaurants } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedRestaurants',
        message: 'Which restaurants do you want to keep? (space to select, enter to confirm)',
        choices,
        validate: (answer) => {
          if (answer.length === 0) {
            return 'You must choose at least one restaurant.';
          }
          return true;
        }
      }]);
      
      // Process selections
      const keptExisting = new Set();
      
      selectedRestaurants.forEach(selection => {
        if (selection.startsWith('existing-')) {
          // Keep existing restaurant, maybe update with new data
          const restaurantId = selection.replace('existing-', '');
          const existingRestaurant = potentialMatches.find(m => m.restaurant.id === restaurantId)?.restaurant;
          if (existingRestaurant) {
            keptExisting.add(restaurantId);
            // Update with new data if there are differences
            results.toUpdate.push({ existing: existingRestaurant, new: newRestaurant });
            console.log(`   ✅ Keeping "${existingRestaurant.name}" (will update with new data)`);
          }
        } else if (selection.startsWith('new-')) {
          // Add new restaurant
          const restaurantData = JSON.parse(selection.replace('new-', ''));
          results.toAdd.push(restaurantData);
          console.log(`   ✅ Adding "${restaurantData.name}" as new restaurant`);
        }
      });
      
      // Mark non-selected existing restaurants for removal
      potentialMatches.forEach(match => {
        if (!keptExisting.has(match.restaurant.id)) {
          results.toRemove.push(match.restaurant);
          console.log(`   🗑️ Will remove "${match.restaurant.name}" (not selected)`);
        }
      });
      
      console.log('');
    }
    
    // Handle restaurants that exist in DB but weren't processed (no matches found)
    const unprocessedExisting = existingRestaurants.filter(existing => {
      const wasProcessed = results.toUpdate.some(update => update.existing.id === existing.id) ||
                          results.toRemove.some(remove => remove.id === existing.id);
      return !wasProcessed;
    });
    
    if (unprocessedExisting.length > 0) {
      console.log(`\n📌 ${unprocessedExisting.length} existing restaurants had no similar matches and will be kept unchanged:`);
      unprocessedExisting.slice(0, 3).forEach(restaurant => {
        console.log(`   • "${restaurant.name}"`);
      });
      if (unprocessedExisting.length > 3) {
        console.log(`   ... and ${unprocessedExisting.length - 3} more`);
      }
      console.log('');
    }
    
    return results;
  }

  async showSummary(results) {
    console.log('\n📋 IMPORT SUMMARY:\n');
    
    if (results.toUpdate.length > 0) {
      console.log(`🔄 RESTAURANTS TO UPDATE: ${results.toUpdate.length}`);
      results.toUpdate.slice(0, 3).forEach(({ existing, new: newData }) => {
        console.log(`   • "${existing.name}" → "${newData.name}"`);
      });
      if (results.toUpdate.length > 3) console.log(`   ... and ${results.toUpdate.length - 3} more`);
      console.log('');
    }
    
    if (results.toAdd.length > 0) {
      console.log(`➕ NEW RESTAURANTS TO ADD: ${results.toAdd.length}`);
      results.toAdd.slice(0, 3).forEach(restaurant => {
        console.log(`   • "${restaurant.name}"`);
      });
      if (results.toAdd.length > 3) console.log(`   ... and ${results.toAdd.length - 3} more`);
      console.log('');
    }
    
    if (results.toRemove.length > 0) {
      console.log(`🗑️  RESTAURANTS TO REMOVE: ${results.toRemove.length}`);
      results.toRemove.slice(0, 3).forEach(restaurant => {
        console.log(`   • "${restaurant.name}"`);
      });
      if (results.toRemove.length > 3) console.log(`   ... and ${results.toRemove.length - 3} more`);
      console.log('');
    }
    
  }

  async executeImport(results) {
    try {
      console.log('🚀 Executing import...\n');
      
      // Remove restaurants if requested
      if (results.toRemove.length > 0) {
        console.log(`🗑️  Removing ${results.toRemove.length} restaurants...`);
        const removeIds = results.toRemove.map(r => r.id);
        
        // Remove associated visits first
        await this.supabase.from('visits').delete().in('restaurant_id', removeIds);
        await this.supabase.from('restaurants').delete().in('id', removeIds);
        
        console.log('   ✅ Removed');
      }
      
      // Update existing restaurants
      if (results.toUpdate.length > 0) {
        console.log(`🔄 Updating ${results.toUpdate.length} restaurants...`);
        
        for (const { existing, new: newData } of results.toUpdate) {
          await this.supabase
            .from('restaurants')
            .update({
              name: newData.name,
              address: newData.address,
              url: newData.url,
              code: newData.code,
              latitude: newData.latitude,
              longitude: newData.longitude,
              description: newData.description,
              phone: newData.phone,
              specials: newData.specials
            })
            .eq('id', existing.id);
        }
        
        console.log('   ✅ Updated');
      }
      
      // Add new restaurants
      if (results.toAdd.length > 0) {
        console.log(`➕ Adding ${results.toAdd.length} new restaurants...`);
        
        await this.supabase.from('restaurants').insert(results.toAdd);
        
        console.log('   ✅ Added');
      }
      
      // Recalculate user stats
      console.log('🔢 Recalculating user stats...');
      await this.recalculateUserStats();
      console.log('   ✅ Stats updated\n');
      
      console.log('🎉 Import completed successfully!');
      console.log(`   Updated: ${results.toUpdate.length} restaurants`);
      console.log(`   Added: ${results.toAdd.length} restaurants`);
      console.log(`   Removed: ${results.toRemove.length} restaurants`);
      
    } catch (error) {
      console.error('\n❌ Import failed:', error.message);
      console.log('\n💡 Your backup is safe and can be restored if needed.');
      process.exit(1);
    }
  }

  async recalculateUserStats() {
    const { data: visits } = await this.supabase.from('visits').select('user_id, restaurant_id');
    const { data: restaurants } = await this.supabase.from('restaurants').select('id');
    const { data: userStats } = await this.supabase.from('user_stats').select('user_id, visit_count, raffle_entries');
    
    const restaurantIds = new Set(restaurants.map(r => r.id));
    const validVisits = visits.filter(v => restaurantIds.has(v.restaurant_id));
    
    const userVisitCounts = {};
    validVisits.forEach(visit => {
      userVisitCounts[visit.user_id] = (userVisitCounts[visit.user_id] || 0) + 1;
    });
    
    for (const stat of userStats) {
      const actualVisits = userVisitCounts[stat.user_id] || 0;
      const correctRaffleEntries = Math.floor(actualVisits / 5);
      
      if (actualVisits !== stat.visit_count || correctRaffleEntries !== stat.raffle_entries) {
        await this.supabase
          .from('user_stats')
          .update({
            visit_count: actualVisits,
            raffle_entries: correctRaffleEntries
          })
          .eq('user_id', stat.user_id);
      }
    }
  }

  async run() {
    try {
      await this.initialize();
      const filePath = await this.selectFile();
      await this.createBackup();
      
      const newRestaurants = await this.parseRestaurantData(filePath);
      const { data: existingRestaurants } = await this.supabase.from('restaurants').select('*');
      
      const results = await this.processMatches(newRestaurants, existingRestaurants);
      await this.showSummary(results);
      
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with import?',
        default: false
      }]);
      
      if (!confirm) {
        console.log('❌ Import cancelled');
        return;
      }
      
      await this.executeImport(results);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

const importer = new SmartImporter();
importer.run();