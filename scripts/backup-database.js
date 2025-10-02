const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]; // YYYY-MM-DD format
  const backupDir = path.join(__dirname, '../backups');
  
  // Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  console.log('💾 Starting database backup...\n');
  
  const backupData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    tables: {}
  };
  
  const tables = ['restaurants', 'sponsors', 'visits', 'users', 'user_stats'];
  
  try {
    for (const table of tables) {
      console.log(`📋 Backing up ${table}...`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.error(`❌ Error backing up ${table}:`, error.message);
        continue;
      }
      
      backupData.tables[table] = {
        count: count,
        data: data
      };
      
      console.log(`   ✅ ${count} records backed up`);
    }
    
    // Save backup file
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`\n✅ Backup completed: ${backupFile}`);
    console.log(`📊 Total records: ${Object.values(backupData.tables).reduce((sum, table) => sum + table.count, 0)}`);
    
    // Clean up old backups (keep last 10)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('database-backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`🗑️  Cleaned up old backup: ${file}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase };