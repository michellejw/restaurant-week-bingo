#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixUserStats() {
  try {
    console.log('🔧 Fixing user stats to match actual visits...\n');
    
    // Get all users and their current stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, visit_count, raffle_entries');
    
    if (statsError) throw statsError;
    
    // Get all valid visits (visits that point to existing restaurants)
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id');
    
    const restaurantIds = new Set(restaurants.map(r => r.id));
    
    const { data: visits } = await supabase
      .from('visits')
      .select('user_id, restaurant_id');
    
    const validVisits = visits.filter(v => restaurantIds.has(v.restaurant_id));
    
    // Calculate correct stats for each user
    const userVisitCounts = {};
    validVisits.forEach(visit => {
      userVisitCounts[visit.user_id] = (userVisitCounts[visit.user_id] || 0) + 1;
    });
    
    // Update each user's stats
    for (const stat of userStats) {
      const actualVisits = userVisitCounts[stat.user_id] || 0;
      const correctRaffleEntries = Math.floor(actualVisits / 4);
      
      if (actualVisits !== stat.visit_count || correctRaffleEntries !== stat.raffle_entries) {
        console.log(`📝 Updating user ${stat.user_id}:`);
        console.log(`   Visit count: ${stat.visit_count} → ${actualVisits}`);
        console.log(`   Raffle entries: ${stat.raffle_entries} → ${correctRaffleEntries}`);
        
        const { error: updateError } = await supabase
          .from('user_stats')
          .update({
            visit_count: actualVisits,
            raffle_entries: correctRaffleEntries
          })
          .eq('user_id', stat.user_id);
        
        if (updateError) {
          console.error(`❌ Error updating user ${stat.user_id}:`, updateError);
        } else {
          console.log(`✅ Updated user ${stat.user_id} stats`);
        }
      } else {
        console.log(`✅ User ${stat.user_id} stats are already correct`);
      }
    }
    
    console.log('\n🎉 User stats cleanup complete!');
    
  } catch (error) {
    console.error('Error fixing user stats:', error);
  }
}

fixUserStats();