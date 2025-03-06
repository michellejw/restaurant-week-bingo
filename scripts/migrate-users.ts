import { createClient } from '@supabase/supabase-js'
import { Clerk } from '@clerk/backend'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Note: This needs to be the service role key, not the anon key
)

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY })

async function migrateUsers() {
  try {
    // Get all users from Supabase
    const { data: supabaseUsers, error } = await supabase
      .from('auth.users')
      .select('*')
    
    if (error) throw error
    
    console.log(`Found ${supabaseUsers.length} users to migrate`)
    
    for (const user of supabaseUsers) {
      try {
        // Create user in Clerk
        const clerkUser = await clerk.users.createUser({
          emailAddress: [user.email],
          password: null, // Users will need to reset their password
          firstName: user.raw_user_meta_data?.first_name,
          lastName: user.raw_user_meta_data?.last_name,
        })
        
        // Send password reset email
        await clerk.users.updateUser(clerkUser.id, {
          passwordResetToken: true
        })
        
        console.log(`Migrated user: ${user.email}`)
      } catch (err) {
        console.error(`Failed to migrate user ${user.email}:`, err)
      }
    }
    
    console.log('Migration complete!')
  } catch (err) {
    console.error('Migration failed:', err)
  }
}

migrateUsers() 