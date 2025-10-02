#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resetDevDatabase() {
  console.log('🗑️  DEV DATABASE RESET TOOL');
  console.log('============================\n');
  
  // Safety check - make sure we're using dev environment
  const isDevEnvironment = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (process.env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost') || 
     !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('prod'));
     
  if (!isDevEnvironment) {
    console.log('❌ This script only works with development databases!');
    console.log('   Current URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('   Make sure you\'re using .env.local (not .env.production)');
    return;
  }
  
  console.log('📊 Current database state:');
  
  // Show current data
  const [restaurants, visits, userStats, users] = await Promise.all([
    supabase.from('restaurants').select('*', { count: 'exact' }).then(r => ({ data: r.data || [], count: r.count || 0 })),
    supabase.from('visits').select('*', { count: 'exact' }).then(r => ({ data: r.data || [], count: r.count || 0 })),
    supabase.from('user_stats').select('*', { count: 'exact' }).then(r => ({ data: r.data || [], count: r.count || 0 })),
    supabase.from('users').select('*', { count: 'exact' }).then(r => ({ data: r.data || [], count: r.count || 0 }))
  ]);
  
  console.log(`   🍴 Restaurants: ${restaurants.count}`);
  console.log(`   ✅ Visits: ${visits.count}`);
  console.log(`   📊 User stats: ${userStats.count}`);
  console.log(`   👤 Users: ${users.count}\n`);
  
  // Create backup first
  console.log('💾 Creating backup before reset...');
  const backupData = {
    restaurants: restaurants.data,
    visits: visits.data,
    userStats: userStats.data,
    users: users.data,
    timestamp: new Date().toISOString(),
    note: 'Pre-reset backup'
  };
  
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  
  const backupFile = path.join(backupsDir, `dev-pre-reset-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log(`   ✅ Backup saved: ${path.basename(backupFile)}\n`);
  
  // Final confirmation
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: '⚠️  This will DELETE ALL DATA from the dev database. Are you sure?',
    default: false
  }]);
  
  if (!confirm) {
    console.log('❌ Reset cancelled');
    return;
  }
  
  const { reallyConfirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'reallyConfirm',
    message: 'Really sure? This cannot be undone (except from backup).',
    default: false
  }]);
  
  if (!reallyConfirm) {
    console.log('❌ Reset cancelled');
    return;
  }
  
  console.log('\n🧹 Clearing all tables...\n');
  
  try {
    // Clear tables in correct order (respecting foreign keys)
    console.log('🗑️  Clearing visits...');
    const { error: visitsError } = await supabase
      .from('visits')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
    
    if (visitsError) throw visitsError;
    console.log('   ✅ Visits cleared');
    
    console.log('🗑️  Clearing user stats...');
    const { error: statsError } = await supabase
      .from('user_stats')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');
    
    if (statsError) throw statsError;
    console.log('   ✅ User stats cleared');
    
    console.log('🗑️  Clearing restaurants...');
    const { error: restaurantsError } = await supabase
      .from('restaurants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (restaurantsError) throw restaurantsError;
    console.log('   ✅ Restaurants cleared');
    
    console.log('🗑️  Clearing users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (usersError) throw usersError;
    console.log('   ✅ Users cleared');
    
    console.log('\n🎉 Database reset complete!');
    console.log('📋 Next steps:');
    console.log('   1. Run `npm run import` to add restaurant data');
    console.log('   2. Test check-ins from a fresh user account');
    console.log('   3. Verify everything works as expected');
    console.log(`   4. Backup is available at: ${path.basename(backupFile)}`);
    
  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    console.log(`💡 Your backup is safe at: ${path.basename(backupFile)}`);
  }
}

resetDevDatabase();