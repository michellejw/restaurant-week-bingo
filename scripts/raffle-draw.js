/**
 * Raffle Draw Script
 * 
 * Fetches users with raffle entries from production database
 * and randomly selects a winner based on their entry count.
 * 
 * Raffle entries = floor(visits / 3)
 * Each entry gives one chance in the drawing.
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

// Verify environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

console.log('Connecting to Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function getRaffleEligibleUsers() {
  console.log('Fetching raffle-eligible users from production database...\n');
  
  // Get all users with at least one raffle entry, including their contact info
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
    throw error;
  }

  if (!userStats || userStats.length === 0) {
    console.log('No users with raffle entries found.');
    return [];
  }

  // Format user data with contact information
  const eligibleUsers = userStats.map(stat => ({
    userId: stat.user_id,
    name: stat.users?.name || 'N/A',
    phone: stat.users?.phone || 'N/A',
    email: stat.users?.email || 'N/A',
    visits: stat.visit_count,
    raffleEntries: stat.raffle_entries
  }));

  return eligibleUsers;
}

function displayEligibleUsers(users) {
  console.log('='.repeat(60));
  console.log('RAFFLE-ELIGIBLE USERS');
  console.log('='.repeat(60));
  console.log(`Total eligible users: ${users.length}\n`);

  let totalEntries = 0;
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Visits: ${user.visits}`);
    console.log(`   Raffle Entries: ${user.raffleEntries}`);
    console.log('');
    totalEntries += user.raffleEntries;
  });

  console.log(`Total raffle entries: ${totalEntries}\n`);
  return totalEntries;
}

function drawWinner(users) {
  // Create an array with one slot per entry
  const entries = [];
  users.forEach(user => {
    for (let i = 0; i < user.raffleEntries; i++) {
      entries.push(user);
    }
  });

  // Randomly select an entry
  const winningIndex = Math.floor(Math.random() * entries.length);
  const winner = entries[winningIndex];

  console.log('='.repeat(60));
  console.log('🎉 RAFFLE WINNER 🎉');
  console.log('='.repeat(60));
  console.log(`Name: ${winner.name}`);
  console.log(`Phone: ${winner.phone}`);
  console.log(`Email: ${winner.email}`);
  console.log(`Visits: ${winner.visits}`);
  console.log(`Raffle Entries: ${winner.raffleEntries}`);
  console.log(`\nWinning entry #${winningIndex + 1} out of ${entries.length} total entries`);
  console.log('='.repeat(60));

  return winner;
}

async function main() {
  try {
    const eligibleUsers = await getRaffleEligibleUsers();
    
    if (eligibleUsers.length === 0) {
      console.log('No eligible users for the raffle.');
      return;
    }

    const totalEntries = displayEligibleUsers(eligibleUsers);
    
    console.log('\nPress Enter to draw a winner...');
    process.stdin.once('data', () => {
      drawWinner(eligibleUsers);
      process.exit(0);
    });

  } catch (error) {
    console.error('Error running raffle:', error);
    process.exit(1);
  }
}

main();
