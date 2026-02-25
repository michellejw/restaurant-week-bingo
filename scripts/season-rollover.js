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

  const seasonKey = previousSeasonKey.trim();

  const { data, error } = await supabase.rpc('archive_and_reset_season', {
    previous_season_key: seasonKey,
  });

  if (error && error.message && error.message.includes('DELETE requires a WHERE clause')) {
    console.log('\n⚠️  RPC rollover blocked by safe-delete policy; using client-side fallback...');
    const fallbackResult = await runClientSideRollover(supabase, seasonKey);
    console.log('\n✅ Season rollover complete (fallback):');
    console.log(JSON.stringify(fallbackResult, null, 2));
    return;
  }

  if (error) {
    throw error;
  }

  console.log('\n✅ Season rollover complete:');
  console.log(JSON.stringify(data, null, 2));
}

async function runClientSideRollover(supabase, seasonKey) {
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('id, user_id, restaurant_id, created_at');

  if (visitsError) {
    throw visitsError;
  }

  const { data: userStats, error: userStatsError } = await supabase
    .from('user_stats')
    .select('user_id, visit_count, raffle_entries, created_at, updated_at');

  if (userStatsError) {
    throw userStatsError;
  }

  const visitsToArchive = (visits || []).map((v) => ({
    season_key: seasonKey,
    id: v.id,
    user_id: v.user_id,
    restaurant_id: v.restaurant_id,
    created_at: v.created_at,
  }));

  if (visitsToArchive.length > 0) {
    const { error: archiveVisitsError } = await supabase
      .from('visits_archive')
      .upsert(visitsToArchive, { onConflict: 'season_key,id' });

    if (archiveVisitsError) {
      throw archiveVisitsError;
    }
  }

  const userStatsToArchive = (userStats || []).map((s) => ({
    season_key: seasonKey,
    user_id: s.user_id,
    visit_count: s.visit_count,
    raffle_entries: s.raffle_entries,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }));

  if (userStatsToArchive.length > 0) {
    const { error: archiveUserStatsError } = await supabase
      .from('user_stats_archive')
      .upsert(userStatsToArchive, { onConflict: 'season_key,user_id' });

    if (archiveUserStatsError) {
      throw archiveUserStatsError;
    }
  }

  if ((visits || []).length > 0) {
    const visitIds = visits.map((v) => v.id);
    const { error: deleteVisitsError } = await supabase
      .from('visits')
      .delete()
      .in('id', visitIds);

    if (deleteVisitsError) {
      throw deleteVisitsError;
    }
  }

  if ((userStats || []).length > 0) {
    const userIds = userStats.map((s) => s.user_id);
    const { error: deleteUserStatsError } = await supabase
      .from('user_stats')
      .delete()
      .in('user_id', userIds);

    if (deleteUserStatsError) {
      throw deleteUserStatsError;
    }
  }

  return {
    previous_season_key: seasonKey,
    visits_archived: visitsToArchive.length,
    user_stats_archived: userStatsToArchive.length,
    visits_cleared: true,
    user_stats_cleared: true,
  };
}

run().catch((error) => {
  console.error('\n❌ Season rollover failed:', error.message || error);
  process.exit(1);
});
