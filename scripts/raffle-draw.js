/**
 * Raffle Draw Script
 *
 * Draws a random raffle winner from production, weighted by entry count.
 *
 * Usage:
 *   node scripts/raffle-draw.js                     # Show eligible users + draw a winner
 *   node scripts/raffle-draw.js --exclude=id1,id2   # Draw excluding specific user IDs
 *
 * Designed to be run by the assistant interactively:
 *   1. Run with no args to see the pool and first draw
 *   2. If the winner should be rejected, re-run with --exclude to add them
 *   3. Repeat until an acceptable winner is drawn
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

// --- CLI args ---
const args = process.argv.slice(2);
const excludeArg = args.find(a => a.startsWith('--exclude='));
const excludeIds = excludeArg
  ? excludeArg.replace('--exclude=', '').split(',').map(id => id.trim())
  : [];

// --- Supabase setup ---
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getRaffleEligibleUsers() {
  const { data: userStats, error } = await supabase
    .from('user_stats')
    .select(`
      user_id,
      visit_count,
      raffle_entries,
      users (
        name,
        phone,
        email
      )
    `)
    .gt('raffle_entries', 0)
    .order('raffle_entries', { ascending: false });

  if (error) {
    console.error('Error fetching user stats:', error);
    process.exit(1);
  }

  if (!userStats || userStats.length === 0) {
    console.log('No users with raffle entries found.');
    process.exit(0);
  }

  return userStats.map(stat => ({
    userId: stat.user_id,
    name: stat.users?.name || 'Unknown',
    phone: stat.users?.phone || 'N/A',
    email: stat.users?.email || 'N/A',
    visits: stat.visit_count,
    raffleEntries: stat.raffle_entries
  }));
}

function displayPool(users, excluded) {
  console.log('='.repeat(60));
  console.log('RAFFLE POOL');
  console.log('='.repeat(60));

  if (excluded.length > 0) {
    console.log(`\nExcluded from this draw (${excluded.length}):`);
    excluded.forEach(u => console.log(`  - ${u.name} (${u.userId})`));
  }

  const pool = users.filter(u => !excludeIds.includes(u.userId));
  const totalEntries = pool.reduce((sum, u) => sum + u.raffleEntries, 0);

  console.log(`\nEligible users: ${pool.length}`);
  console.log(`Total raffle entries: ${totalEntries}\n`);

  pool.forEach((user, i) => {
    const odds = ((user.raffleEntries / totalEntries) * 100).toFixed(1);
    console.log(`  ${i + 1}. ${user.name} — ${user.visits} visits, ${user.raffleEntries} entries (${odds}%)`);
  });

  console.log('');
  return { pool, totalEntries };
}

function drawWinner(pool, totalEntries) {
  // Build weighted entry array
  const entries = [];
  pool.forEach(user => {
    for (let i = 0; i < user.raffleEntries; i++) {
      entries.push(user);
    }
  });

  const winningIndex = Math.floor(Math.random() * entries.length);
  const winner = entries[winningIndex];

  console.log('='.repeat(60));
  console.log('WINNER');
  console.log('='.repeat(60));
  console.log(`  Name:    ${winner.name}`);
  console.log(`  Phone:   ${winner.phone}`);
  console.log(`  Email:   ${winner.email}`);
  console.log(`  Visits:  ${winner.visits}`);
  console.log(`  Entries: ${winner.raffleEntries}`);
  console.log(`  Odds:    ${((winner.raffleEntries / totalEntries) * 100).toFixed(1)}%`);
  console.log(`\n  (entry ${winningIndex + 1} of ${totalEntries})`);
  console.log('='.repeat(60));
  console.log(`\nTo accept: done!`);
  console.log(`To reject and redraw, run again with:`);
  console.log(`  node scripts/raffle-draw.js --exclude=${[...excludeIds, winner.userId].join(',')}`);

  return winner;
}

async function main() {
  console.log(`Connecting to: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  const allUsers = await getRaffleEligibleUsers();

  const excluded = allUsers.filter(u => excludeIds.includes(u.userId));
  const { pool, totalEntries } = displayPool(allUsers, excluded);

  if (pool.length === 0) {
    console.log('No eligible users remaining after exclusions.');
    process.exit(0);
  }

  drawWinner(pool, totalEntries);
}

main();
