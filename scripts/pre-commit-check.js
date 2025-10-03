#!/usr/bin/env node
/**
 * PRE-COMMIT SAFETY CHECK
 * 
 * Quick checks to run before committing code
 * Usage: node scripts/pre-commit-check.js
 */

console.log('🔍 PRE-COMMIT SAFETY CHECK');
console.log('==========================');

const { execSync } = require('child_process');
const fs = require('fs');

let hasErrors = false;

// Check 1: Restaurant Week config is valid
console.log('\n📅 Checking Restaurant Week configuration...');
try {
  const configPath = 'src/config/restaurant-week.ts';
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const dateMatch = content.match(/startDate:\s*'([^']+)'/);
    if (dateMatch) {
      const startDate = new Date(dateMatch[1]);
      if (isNaN(startDate.getTime())) {
        console.log('❌ Invalid date format in restaurant-week.ts');
        hasErrors = true;
      } else {
        console.log(`✅ Valid date: ${startDate.toDateString()}`);
      }
    } else {
      console.log('❌ No startDate found in restaurant-week.ts');
      hasErrors = true;
    }
  } else {
    console.log('❌ Restaurant Week config missing');
    hasErrors = true;
  }
} catch (error) {
  console.log(`❌ Error checking config: ${error.message}`);
  hasErrors = true;
}

// Check 2: TypeScript compilation
console.log('\n🔧 Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript errors found');
  console.log(error.stdout?.toString() || error.stderr?.toString());
  hasErrors = true;
}

// Check 3: Basic build test (only if we have real env vars)
console.log('\n🏗️ Testing build process...');
if (fs.existsSync('.env.local')) {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build test successful');
  } catch (error) {
    console.log('❌ Build failed');
    // Show only the important parts of the error
    const errorOutput = error.stdout?.toString() || error.stderr?.toString();
    const lines = errorOutput.split('\n');
    const importantLines = lines.filter(line => 
      line.includes('Error:') || 
      line.includes('error') ||
      line.includes('failed') ||
      line.includes('Type error')
    ).slice(0, 5); // Show first 5 relevant error lines
    
    importantLines.forEach(line => console.log(`  ${line}`));
    hasErrors = true;
  }
} else {
  console.log('⚠️  Skipping build test (no .env.local found)');
}

// Check 4: Environment file safety
console.log('\n🔐 Checking environment file safety...');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  const envFilesStaged = status.split('\n').some(line => 
    line.includes('.env.local') || line.includes('.env.production')
  );
  
  if (envFilesStaged) {
    console.log('❌ WARNING: Environment files are staged for commit!');
    console.log('   This could expose secrets. Please unstage them.');
    hasErrors = true;
  } else {
    console.log('✅ Environment files are not being committed');
  }
} catch (error) {
  console.log('⚠️  Could not check git status');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ PRE-COMMIT CHECK FAILED');
  console.log('Please fix the issues above before committing.');
  process.exit(1);
} else {
  console.log('✅ PRE-COMMIT CHECK PASSED');
  console.log('Code is ready to commit!');
  process.exit(0);
}