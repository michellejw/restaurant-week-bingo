const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

// Shared fuzzy matching functions
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

function findPotentialMatches(newItem, existingItems, config, threshold = 0.65) {
  const matches = [];
  const newNameNormalized = config.normalizeName(newItem.name);
  
  for (const existing of existingItems) {
    const existingNameNormalized = config.normalizeName(existing.name);
    
    // Calculate similarity
    const exactMatch = newItem.name.trim().toLowerCase() === existing.name.trim().toLowerCase();
    const stringSimilarity = similarity(newNameNormalized, existingNameNormalized);
    
    // Apply config-specific abbreviation bonus
    let abbreviationBonus = 0;
    if (config.getAbbreviationBonus) {
      abbreviationBonus = config.getAbbreviationBonus(newNameNormalized, existingNameNormalized);
    }
    
    const combinedScore = Math.min(1.0, stringSimilarity + abbreviationBonus);
    
    if (exactMatch || combinedScore >= threshold) {
      matches.push({
        item: existing,
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
  const envPath = path.join(__dirname, '..', '..', envFile);
  
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
  constructor(config) {
    this.config = config;
    this.supabase = null;
    this.environment = null;
  }

  async initialize() {
    console.log(`${this.config.emoji} Smart ${this.config.displayName} Import Tool\n`);
    
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
    const dataDir = path.join(__dirname, '..', '..', 'supabase', 'data');
    const files = fs.readdirSync(dataDir)
      .filter(f => f.toLowerCase().startsWith(this.config.filePrefix.toLowerCase()) && f.endsWith('.xlsx'))
      .map(file => ({
        name: file,
        path: path.join(dataDir, file),
        stats: fs.statSync(path.join(dataDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Most recent first
    
    if (files.length === 0) {
      console.log(`❌ No ${this.config.filePrefix}*.xlsx files found in supabase/data/`);
      process.exit(1);
    }
    
    if (files.length === 1) {
      console.log(`📁 Using file: ${files[0].name}\n`);
      return files[0].path;
    }
    
    const choices = files.map(file => ({
      name: `${file.name} (${file.stats.mtime.toLocaleDateString()} ${file.stats.mtime.toLocaleTimeString()})`,
      value: file.path
    }));
    
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
    
    const backupPromises = [
      this.supabase.from(this.config.tableName).select('*').then(r => r.data || [])
    ];
    
    // Add additional tables for backup if specified
    if (this.config.additionalBackupTables) {
      this.config.additionalBackupTables.forEach(table => {
        backupPromises.push(
          this.supabase.from(table).select('*').then(r => r.data || [])
        );
      });
    }
    
    const backupResults = await Promise.all(backupPromises);
    const backupData = {
      environment: this.environment,
      [this.config.tableName]: backupResults[0],
      timestamp: new Date().toISOString()
    };
    
    // Add additional tables to backup data
    if (this.config.additionalBackupTables) {
      this.config.additionalBackupTables.forEach((table, index) => {
        backupData[table] = backupResults[index + 1];
      });
    }
    
    const backupsDir = path.join(__dirname, '..', '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const backupFile = path.join(backupsDir, 
      `${this.environment}-${this.config.tableName}-pre-import-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`
    );
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`   ✅ Backup saved: ${path.basename(backupFile)}\n`);
    
    return backupFile;
  }

  async parseData(filePath) {
    const workbook = XLSX.readFile(filePath);
    
    // Always use sheet 2 (index 1) - sheet 1 is instructions
    const sheetName = workbook.SheetNames[1];
    if (!sheetName) {
      throw new Error('Could not find data sheet (sheet 2). Make sure your file has at least 2 sheets.');
    }
    
    console.log(`📊 Reading sheet: "${sheetName}"`);
    
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      throw new Error('Spreadsheet appears to be empty or has no data rows');
    }
    
    // Use config-specific parsing
    const { items, errors } = await this.config.parseDataRows(rawData);
    
    console.log(`   Found ${items.length} ${this.config.displayName.toLowerCase()}s to import`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${errors.length} error(s) in input file:`);
      errors.forEach(error => console.log(`   • ${error}`));
    }
    
    // Check for duplicates in the input file (using config-specific key)
    if (this.config.getDuplicateKey) {
      const duplicates = [];
      const seen = new Map();
      
      items.forEach((item, index) => {
        const key = this.config.getDuplicateKey(item);
        if (seen.has(key)) {
          duplicates.push({
            item,
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
          console.log(`   • "${dup.item.name}" appears multiple times`);
        });
        console.log('   Only the first occurrence will be processed.\n');
        
        // Remove duplicates
        const uniqueItems = [];
        const uniqueKeys = new Set();
        
        items.forEach(item => {
          const key = this.config.getDuplicateKey(item);
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            uniqueItems.push(item);
          }
        });
        
        console.log('');
        return uniqueItems;
      }
    }
    
    console.log('');
    return items;
  }

  async processMatches(newItems, existingItems) {
    const results = {
      toUpdate: [],
      toAdd: [],
      toRemove: []
    };
    
    console.log(`🔍 Processing ${this.config.displayName.toLowerCase()} matches...\n`);
    
    for (const newItem of newItems) {
      const potentialMatches = findPotentialMatches(newItem, existingItems, this.config);
      
      if (potentialMatches.length === 0) {
        // No matches - this is a new item
        results.toAdd.push(newItem);
        console.log(`✨ NEW: "${newItem.name}" - will be added`);
        continue;
      }
      
      // Show the item and potential matches
      console.log(`\n${this.config.newItemEmoji} NEW ${this.config.displayName.toUpperCase()}: "${newItem.name}"`);
      this.config.displayItemDetails(newItem);
      
      if (potentialMatches[0].exactMatch) {
        // Exact match - auto-update
        console.log(`   ✅ Exact match found: "${potentialMatches[0].item.name}"`);
        console.log(`   → Will update existing ${this.config.displayName.toLowerCase()}\n`);
        results.toUpdate.push({ existing: potentialMatches[0].item, new: newItem });
        continue;
      }
      
      // Show potential matches
      console.log(`   🤔 Found similar ${this.config.displayName.toLowerCase()}s:`);
      potentialMatches.forEach((match, index) => {
        const label = String.fromCharCode(65 + index); // A, B, C, etc.
        console.log(`   ${label}. "${match.item.name}" (existing) - ${match.confidence} confidence`);
        this.config.displayItemDetails(match.item, '      ');
      });
      
      const newLabel = String.fromCharCode(65 + potentialMatches.length);
      console.log(`   ${newLabel}. "${newItem.name}" (from file)`);
      this.config.displayItemDetails(newItem, '      ');
      
      // Create checkbox choices
      const choices = [
        ...potentialMatches.map((match, index) => ({
          name: `${String.fromCharCode(65 + index)}. "${match.item.name}" (existing)`,
          value: `existing-${match.item.id}`,
          checked: false
        })),
        {
          name: `${String.fromCharCode(65 + potentialMatches.length)}. "${newItem.name}" (from file)`,
          value: `new-${JSON.stringify(newItem)}`,
          checked: false
        }
      ];
      
      const { selectedItems } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'selectedItems',
        message: `Which ${this.config.displayName.toLowerCase()}s do you want to keep? (space to select, enter to confirm)`,
        choices,
        validate: (answer) => {
          if (answer.length === 0) {
            return `You must choose at least one ${this.config.displayName.toLowerCase()}.`;
          }
          return true;
        }
      }]);
      
      // Process selections (same logic as restaurant import)
      const keptExisting = new Set();
      
      selectedItems.forEach(selection => {
        if (selection.startsWith('existing-')) {
          // Keep existing item, maybe update with new data
          const itemId = selection.replace('existing-', '');
          const existingItem = potentialMatches.find(m => m.item.id === itemId)?.item;
          if (existingItem) {
            keptExisting.add(itemId);
            // Update with new data if there are differences
            results.toUpdate.push({ existing: existingItem, new: newItem });
            console.log(`   ✅ Keeping "${existingItem.name}" (will update with new data)`);
          }
        } else if (selection.startsWith('new-')) {
          // Add new item
          const itemData = JSON.parse(selection.replace('new-', ''));
          results.toAdd.push(itemData);
          console.log(`   ✅ Adding "${itemData.name}" as new ${this.config.displayName.toLowerCase()}`);
        }
      });
      
      // Mark non-selected existing items for removal
      potentialMatches.forEach(match => {
        if (!keptExisting.has(match.item.id)) {
          results.toRemove.push(match.item);
          console.log(`   🗑️ Will remove "${match.item.name}" (not selected)`);
        }
      });
      
      console.log('');
    }
    
    // Handle items that exist in DB but weren't processed (no matches found)
    // This matches restaurant logic exactly - just logs them, doesn't ask
    const unprocessedExisting = existingItems.filter(existing => {
      const wasProcessed = results.toUpdate.some(update => update.existing.id === existing.id) ||
                          results.toRemove.some(remove => remove.id === existing.id);
      return !wasProcessed;
    });
    
    if (unprocessedExisting.length > 0) {
      console.log(`\n📌 ${unprocessedExisting.length} existing ${this.config.displayName.toLowerCase()}s had no similar matches and will be kept unchanged:`);
      unprocessedExisting.slice(0, 3).forEach(item => {
        console.log(`   • "${item.name}"`);
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
      console.log(`🔄 ${this.config.displayName.toUpperCase()}S TO UPDATE: ${results.toUpdate.length}`);
      results.toUpdate.slice(0, 3).forEach(({ existing, new: newData }) => {
        console.log(`   • "${existing.name}" → "${newData.name}"`);
      });
      if (results.toUpdate.length > 3) console.log(`   ... and ${results.toUpdate.length - 3} more`);
      console.log('');
    }
    
    if (results.toAdd.length > 0) {
      console.log(`➕ NEW ${this.config.displayName.toUpperCase()}S TO ADD: ${results.toAdd.length}`);
      results.toAdd.slice(0, 3).forEach(item => {
        console.log(`   • "${item.name}"`);
      });
      if (results.toAdd.length > 3) console.log(`   ... and ${results.toAdd.length - 3} more`);
      console.log('');
    }
    
    if (results.toRemove.length > 0) {
      console.log(`🗑️  ${this.config.displayName.toUpperCase()}S TO REMOVE: ${results.toRemove.length}`);
      results.toRemove.slice(0, 3).forEach(item => {
        console.log(`   • "${item.name}"`);
      });
      if (results.toRemove.length > 3) console.log(`   ... and ${results.toRemove.length - 3} more`);
      console.log('');
    }
  }

  async executeImport(results) {
    try {
      console.log('🚀 Executing import...\n');
      
      // Remove items if requested
      if (results.toRemove.length > 0) {
        console.log(`🗑️  Removing ${results.toRemove.length} ${this.config.displayName.toLowerCase()}s...`);
        const removeIds = results.toRemove.map(r => r.id);
        
        // Handle cascading deletes if configured
        if (this.config.handleCascadingDeletes) {
          await this.config.handleCascadingDeletes(this.supabase, removeIds);
        }
        
        await this.supabase.from(this.config.tableName).delete().in('id', removeIds);
        
        console.log('   ✅ Removed');
      }
      
      // Update existing items
      if (results.toUpdate.length > 0) {
        console.log(`🔄 Updating ${results.toUpdate.length} ${this.config.displayName.toLowerCase()}s...`);
        
        for (const { existing, new: newData } of results.toUpdate) {
          const updateData = this.config.prepareUpdateData(newData);
          await this.supabase
            .from(this.config.tableName)
            .update(updateData)
            .eq('id', existing.id);
        }
        
        console.log('   ✅ Updated');
      }
      
      // Add new items
      if (results.toAdd.length > 0) {
        console.log(`➕ Adding ${results.toAdd.length} new ${this.config.displayName.toLowerCase()}s...`);
        
        const itemsToAdd = results.toAdd.map(item => {
          const { _rowNumber, ...itemData } = item;
          return this.config.prepareInsertData ? this.config.prepareInsertData(itemData) : itemData;
        });
        
        await this.supabase.from(this.config.tableName).insert(itemsToAdd);
        
        console.log('   ✅ Added');
      }
      
      // Post-import tasks if configured
      if (this.config.postImportTasks) {
        await this.config.postImportTasks(this.supabase);
      }
      
      console.log('🎉 Import completed successfully!');
      console.log(`   Updated: ${results.toUpdate.length} ${this.config.displayName.toLowerCase()}s`);
      console.log(`   Added: ${results.toAdd.length} ${this.config.displayName.toLowerCase()}s`);
      console.log(`   Removed: ${results.toRemove.length} ${this.config.displayName.toLowerCase()}s`);
      
    } catch (error) {
      console.error('\n❌ Import failed:', error.message);
      console.log('\n💡 Your backup is safe and can be restored if needed.');
      throw error;
    }
  }

  async run() {
    try {
      await this.initialize();
      const filePath = await this.selectFile();
      await this.createBackup();
      
      const newItems = await this.parseData(filePath);
      const { data: existingItems } = await this.supabase.from(this.config.tableName).select('*');
      
      const results = await this.processMatches(newItems, existingItems);
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

module.exports = { SmartImporter };