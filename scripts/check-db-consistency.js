#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConsistency() {
  try {
    console.log('🔍 Checking database consistency...\n');
    
    // Get restaurant count
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, name')
      .order('name');
    
    if (restError) throw restError;
    
    console.log(`📊 Current restaurants in database: ${restaurants.length}`);
    console.log(`   First few: ${restaurants.slice(0, 3).map(r => r.name).join(', ')}${restaurants.length > 3 ? '...' : ''}\n`);
    
    // Get all visits
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('id, user_id, restaurant_id, created_at')
      .order('created_at', { ascending: false });
    
    if (visitsError) throw visitsError;
    
    console.log(`📊 Total visits in database: ${visits.length}\n`);
    
    // Check for orphaned visits
    const restaurantIds = new Set(restaurants.map(r => r.id));
    const orphanedVisits = visits.filter(v => !restaurantIds.has(v.restaurant_id));
    
    if (orphanedVisits.length > 0) {
      console.log(`⚠️  Found ${orphanedVisits.length} ORPHANED visits (pointing to deleted restaurants):`);
      orphanedVisits.forEach(visit => {
        console.log(`   Visit ID: ${visit.id} → Missing Restaurant ID: ${visit.restaurant_id}`);
      });
      console.log('');
    } else {
      console.log('✅ No orphaned visits found\n');
    }
    
    // Get user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, visit_count, raffle_entries');
    
    if (statsError) throw statsError;
    
    console.log('📊 User stats:');
    userStats.forEach(stat => {
      console.log(`   User ${stat.user_id}: ${stat.visit_count} visits, ${stat.raffle_entries} raffle entries`);
    });
    console.log('');
    
    // Check if stats match actual visits
    console.log('🔍 Checking if user stats match actual visit counts...');
    for (const stat of userStats) {
      const userVisits = visits.filter(v => v.user_id === stat.user_id && restaurantIds.has(v.restaurant_id));
      const actualCount = userVisits.length;
      
      if (actualCount !== stat.visit_count) {
        console.log(`⚠️  User ${stat.user_id}: Stats show ${stat.visit_count} visits, but only ${actualCount} valid visits found`);
      } else {
        console.log(`✅ User ${stat.user_id}: Stats match (${actualCount} visits)`);
      }
    }
    
  } catch (error) {
    console.error('Error checking consistency:', error);
  }
}

checkConsistency();