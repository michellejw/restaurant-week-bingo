#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { createClient } = require('@supabase/supabase-js');

function loadEnvironment(env) {
  const envFile = env === 'prod' ? '.env.production' : '.env.local';
  const envPath = path.join(__dirname, '..', envFile);

  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envFile}`);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return;
    }

    const [key, ...valueParts] = trimmed.split('=');
    let value = valueParts.join('=').trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    envVars[key.trim()] = value;
  });

  return envVars;
}

async function run() {
  console.log('🗂️  Season Rollover Tool\n');

  const { environment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Which database do you want to roll over?',
      choices: [
        { name: '🧪 Development', value: 'dev' },
        { name: '🚀 Production', value: 'prod' },
      ],
    },
  ]);

  const { previousSeasonKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'previousSeasonKey',
      message: 'Enter previous season key to archive (example: fall2025):',
      validate: (value) => {
        if (!value || !value.trim()) {
          return 'Season key is required.';
        }
        return true;
      },
    },
  ]);

  const envVars = loadEnvironment(environment);

  if (!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  );

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message:
        environment === 'prod'
          ? `Archive ${previousSeasonKey.trim()} and clear active visits/user_stats on PRODUCTION?`
          : `Archive ${previousSeasonKey.trim()} and clear active visits/user_stats on development?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log('❌ Cancelled');
    return;
  }

  const { data, error } = await supabase.rpc('archive_and_reset_season', {
    previous_season_key: previousSeasonKey.trim(),
  });

  if (error) {
    throw error;
  }

  console.log('\n✅ Season rollover complete:');
  console.log(JSON.stringify(data, null, 2));
}

run().catch((error) => {
  console.error('\n❌ Season rollover failed:', error.message || error);
  process.exit(1);
});
