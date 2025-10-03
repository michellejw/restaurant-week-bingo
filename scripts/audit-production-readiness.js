#!/usr/bin/env node
/**
 * PRODUCTION READINESS AUDIT SCRIPT
 * 
 * Run this to check if your app is ready for production deployment
 * Usage: node scripts/audit-production-readiness.js
 */

console.log('🔍 RESTAURANT WEEK BINGO - PRODUCTION READINESS AUDIT');
console.log('================================================');

const fs = require('fs');
const path = require('path');

// Check environment files
function checkEnvironmentFiles() {
  console.log('\n📁 ENVIRONMENT FILES CHECK:');
  
  const envFiles = ['.env.local', '.env.production'];
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      
      // Check if contains required variables
      const content = fs.readFileSync(file, 'utf8');
      const missingVars = requiredVars.filter(varName => !content.includes(varName));
      
      if (missingVars.length === 0) {
        console.log(`   ✅ All required variables present`);
      } else {
        console.log(`   ⚠️  Missing variables: ${missingVars.join(', ')}`);
      }
      
      // Check dev vs prod keys
      const hasDevKeys = content.includes('pk_test_') || content.includes('sk_test_');
      const hasProdKeys = content.includes('pk_live_') || content.includes('sk_live_');
      
      if (file === '.env.local' && hasDevKeys) {
        console.log(`   ✅ Contains development keys (correct for local dev)`);
      } else if (file === '.env.production' && hasProdKeys) {
        console.log(`   ✅ Contains production keys (correct for production)`);
      } else {
        console.log(`   ⚠️  Key type mismatch - check dev/prod keys`);
      }
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
}

// Check git status
function checkGitStatus() {
  console.log('\n🔄 GIT STATUS CHECK:');
  
  const { execSync } = require('child_process');
  
  try {
    // Check if env files are ignored
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (gitignore.includes('.env')) {
      console.log('✅ Environment files are properly gitignored');
    } else {
      console.log('❌ WARNING: Environment files may not be gitignored');
    }
    
    // Check current branch
    const currentBranch = execSync('git branch --show-current').toString().trim();
    console.log(`📍 Current branch: ${currentBranch}`);
    
    // Check if there are uncommitted changes
    const status = execSync('git status --porcelain').toString();
    if (status.length === 0) {
      console.log('✅ No uncommitted changes');
    } else {
      console.log('⚠️  Uncommitted changes present');
    }
    
  } catch (error) {
    console.log(`❌ Git check failed: ${error.message}`);
  }
}

// Check database schema files
function checkDatabaseFiles() {
  console.log('\n🗄️  DATABASE SCHEMA CHECK:');
  
  const schemaFiles = [
    'supabase/updated_schema.sql',
    'supabase/dev_data_import.sql'
  ];
  
  schemaFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`⚠️  ${file} missing (may need for prod setup)`);
    }
  });
}

// Check Restaurant Week configuration
function checkRestaurantWeekConfig() {
  console.log('\n🍽️  RESTAURANT WEEK CONFIG CHECK:');
  
  const configPath = 'src/config/restaurant-week.ts';
  if (fs.existsSync(configPath)) {
    console.log('✅ Restaurant Week config file exists');
    
    const content = fs.readFileSync(configPath, 'utf8');
    
    // Extract the start date
    const dateMatch = content.match(/startDate:\s*'([^']+)'/);
    if (dateMatch) {
      const startDate = new Date(dateMatch[1]);
      const now = new Date();
      const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      console.log(`📅 Restaurant Week starts: ${startDate.toDateString()}`);
      if (daysUntil > 0) {
        console.log(`⏰ ${daysUntil} days until Restaurant Week`);
      } else {
        console.log(`🎉 Restaurant Week is active!`);
      }
    }
    
    // Check for testing overrides
    const devOverride = content.includes('allowInDevelopment: true');
    const prodOverride = content.includes('forceEnableInProduction: true');
    
    if (devOverride) {
      console.log('🧪 Development override enabled (check-ins work in dev before start date)');
    }
    
    if (prodOverride) {
      console.log('🚨 WARNING: Production override is ENABLED!');
      console.log('   This will allow check-ins in production before Restaurant Week!');
      console.log('   Make sure this is intentional!');
    }
  } else {
    console.log('❌ Restaurant Week config missing');
  }
}

// Check critical component files
function checkCriticalFiles() {
  console.log('\n🔧 CRITICAL FILES CHECK:');
  
  const criticalFiles = [
    'src/components/UserInitializer.tsx',
    'src/components/CheckInModal.tsx',
    'src/lib/supabase.ts',
    'src/lib/services/database.ts',
    'package.json'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
}

// Run all checks
function runAudit() {
  checkEnvironmentFiles();
  checkGitStatus();
  checkDatabaseFiles();
  checkRestaurantWeekConfig();
  checkCriticalFiles();
  
  console.log('\n🏁 AUDIT COMPLETE');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Fix any ❌ or ⚠️  issues above');
  console.log('2. Check Vercel dashboard settings');
  console.log('3. Check Supabase RLS policies');
  console.log('4. Check Clerk configuration');
  console.log('5. Test Clerk-Supabase sync');
}

runAudit();