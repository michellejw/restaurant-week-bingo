#!/usr/bin/env node
/**
 * SPONSOR BACKUP SCRIPT
 * 
 * Creates backups of sponsor data from dev or production
 * Usage: 
 *   npm run sponsor:backup (dev)
 *   npm run sponsor:backup:prod (production)
 */

const fs = require('fs');
const path = require('path');

console.log('💾 SPONSOR BACKUP SYSTEM');
console.log('========================');

async function createBackup() {
  try {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    
    // Load environment variables
    if (environment === 'production') {
      console.log('🚀 Using PRODUCTION environment');
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
      console.log('🧪 Using DEVELOPMENT environment');
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
    
    console.log(`\n📡 Connecting to ${environment} database...`);
    
    // Dynamic import to handle TypeScript modules
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
    
    // Fetch sponsor data
    const { data: sponsors, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    console.log(`📊 Found ${sponsors.length} sponsors to backup`);
    
    // Create backup data structure
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        environment: environment,
        version: '1.0.0',
        record_count: sponsors.length
      },
      sponsors: {
        count: sponsors.length,
        data: sponsors
      }
    };
    
    // Create backups directory
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `sponsor-backup-${environment}-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    // Write backup file
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    console.log('\n✅ BACKUP COMPLETE!');
    console.log('===================');
    console.log(`📁 File: ${filename}`);
    console.log(`📍 Location: backups/`);
    console.log(`📊 Environment: ${environment.toUpperCase()}`);
    console.log(`📈 Sponsors backed up: ${sponsors.length}`);
    
    // Clean up old backups (keep last 10)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('sponsor-backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        stats: fs.statSync(path.join(backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    if (backupFiles.length > 10) {
      const toDelete = backupFiles.slice(10);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Cleaned up old backup: ${file.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

createBackup();