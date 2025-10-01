const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function showRestaurantCodes() {
  try {
    console.log('Fetching restaurant codes...\n');
    
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('name, code')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    console.log('Restaurant Codes for Testing:');
    console.log('=' .repeat(40));
    
    restaurants.forEach(restaurant => {
      console.log(`${restaurant.name}: ${restaurant.code}`);
    });
    
    console.log('\n' + '='.repeat(40));
    console.log(`Total: ${restaurants.length} restaurants`);
    
  } catch (error) {
    console.error('Error fetching restaurant codes:', error);
  }
}

async function checkUserStats() {
  try {
    console.log('\n\nChecking user stats and visits...\n');
    
    // Get all users and their stats
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name');
    
    if (usersError) throw usersError;
    
    for (const user of users) {
      console.log(`\nUser: ${user.email || user.name || user.id} (ID: ${user.id})`);
      console.log('-'.repeat(50));
      
      // Get user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (statsError) {
        console.log('No stats found');
      } else {
        console.log(`Stats - Visits: ${stats.visit_count}, Raffle entries: ${stats.raffle_entries}`);
      }
      
      // Get actual visits count
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('*, restaurants(name)')
        .eq('user_id', user.id);
      
      if (visitsError) {
        console.log('Error fetching visits:', visitsError);
      } else {
        console.log(`Actual visits count: ${visits.length}`);
        visits.forEach(visit => {
          console.log(`  - ${visit.restaurants.name} (${visit.created_at})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking user stats:', error);
  }
}

async function resetUserStats(userId) {
  try {
    console.log(`Resetting stats for user ${userId}...`);
    
    // Count actual visits
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .eq('user_id', userId);
    
    if (visitsError) throw visitsError;
    
    const actualCount = visits.length;
    const correctRaffleEntries = Math.floor(actualCount / 4);
    
    // Update stats to match actual visits
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({
        visit_count: actualCount,
        raffle_entries: correctRaffleEntries
      })
      .eq('user_id', userId);
    
    if (updateError) throw updateError;
    
    console.log(`✅ Stats reset: ${actualCount} visits, ${correctRaffleEntries} raffle entries`);
    
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
}

if (process.argv.includes('--debug')) {
  checkUserStats();
} else if (process.argv.includes('--reset')) {
  const userId = process.argv[3]; // Get user ID from command line
  if (!userId) {
    console.error('Usage: node show-codes.js --reset <user_id>');
    process.exit(1);
  }
  resetUserStats(userId);
} else {
  showRestaurantCodes();
}
