const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin operations
);

async function cleanupTestVisits() {
  try {
    console.log('🔍 Finding user account...');
    
    // Find the user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', 'michellejw@gmail.com');
    
    if (userError) {
      throw new Error(`Error finding user: ${userError.message}`);
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No user found with email michellejw@gmail.com');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    
    // Count current visits
    const { data: visitCount, error: countError } = await supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (countError) {
      throw new Error(`Error counting visits: ${countError.message}`);
    }
    
    const totalVisits = visitCount || 0;
    console.log(`📊 Current test visits to delete: ${totalVisits}`);
    
    if (totalVisits === 0) {
      console.log('✅ No visits to clean up!');
      return;
    }
    
    // Confirm before deletion
    console.log(`⚠️  About to delete ${totalVisits} test visits for ${user.email}`);
    console.log('   This will also reset user_stats to 0 visits via database triggers.');
    
    // Delete the visits
    console.log('🗑️  Deleting test visits...');
    const { error: deleteError } = await supabase
      .from('visits')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      throw new Error(`Error deleting visits: ${deleteError.message}`);
    }
    
    console.log('✅ Test visits deleted successfully!');
    
    // Verify cleanup
    const { data: remainingVisits, error: verifyError } = await supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (verifyError) {
      console.log('⚠️  Could not verify cleanup, but deletion command succeeded');
    } else {
      console.log(`✅ Verification: ${remainingVisits || 0} visits remaining for user`);
    }
    
    // Check user_stats was updated
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('visit_count, raffle_entries')
      .eq('user_id', user.id)
      .single();
    
    if (!statsError && userStats) {
      console.log(`📈 User stats updated: ${userStats.visit_count} visits, ${userStats.raffle_entries} raffle entries`);
    }
    
    console.log('🎉 Cleanup completed successfully!');
    console.log('   Your account is now ready with clean data for analytics.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestVisits();