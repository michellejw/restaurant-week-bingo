import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Create client with service role and disable auto-refresh
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testRestaurants = [
  {
    id: uuidv4(),
    name: "Ocean Breeze Cafe",
    address: "123 Coastal Drive",
    url: "https://example.com/oceanbreeze",
    latitude: 34.2257,
    longitude: -77.9447,
    code: "OCEAN123",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "The Copper Kettle",
    address: "456 Market Street",
    url: "https://example.com/copperkitchen",
    latitude: 34.2359,
    longitude: -77.9482,
    code: "COPPER456",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Riverwalk Bistro",
    address: "789 Water Street",
    url: "https://example.com/riverwalk",
    latitude: 34.2368,
    longitude: -77.9504,
    code: "RIVER789",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

async function seedRestaurants() {
  console.log('Starting to seed restaurants...')

  // First, try to delete existing restaurants
  const { error: deleteError } = await supabase
    .from('Restaurant')
    .delete()
    .not('id', 'eq', '00000000-0000-0000-0000-000000000000')

  if (deleteError) {
    console.log('Note: No existing restaurants to delete or no permission:', deleteError)
  } else {
    console.log('Cleared existing restaurants')
  }

  // Insert restaurants using service role key
  for (const restaurant of testRestaurants) {
    const { data, error } = await supabase
      .from('Restaurant')
      .insert([restaurant])
      .select()

    if (error) {
      console.error(`Error inserting ${restaurant.name}:`, error)
    } else {
      console.log(`Added ${restaurant.name}:`, data)
    }
  }
}

seedRestaurants()
  .then(() => {
    console.log('Seeding complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('Seeding failed:', error)
    process.exit(1)
  }) 