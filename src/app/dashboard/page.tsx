'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { Restaurant, RestaurantVisit } from '@/types'
import BingoCard from '@/components/BingoCard'
import RestaurantCodeScanner from '@/components/RestaurantCodeScanner'
import { v4 as uuidv4 } from 'uuid'

// Dynamically import the map component to avoid SSR issues with Leaflet
const RestaurantMap = dynamic(() => import('@/components/RestaurantMap'), {
  ssr: false,
})

export default function DashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [visits, setVisits] = useState<RestaurantVisit[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const session = await checkUser()
      if (session) {
        await fetchData()
      }
    }
    init()
  }, [])

  const checkUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('Auth session:', session, 'Error:', error)
    if (error || !session) {
      console.log('Redirecting to login...')
      router.push('/login')
      return null
    }
    return session
  }

  const fetchData = async () => {
    try {
      // Fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('Restaurant')
        .select('*')

      if (restaurantsError) {
        console.error('Error fetching restaurants:', restaurantsError)
        setError('Error loading restaurants')
        return
      }
      
      setRestaurants(restaurantsData || [])
      console.log('Loaded restaurants:', restaurantsData)

      // Fetch user's visits
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      
      if (user) {
        const { data: visitsData, error: visitsError } = await supabase
          .from('RestaurantVisit')
          .select('*')
          .eq('userId', user.id)

        if (visitsError) {
          console.error('Error fetching visits:', visitsError)
          setError('Error loading visits')
          return
        }

        setVisits(visitsData || [])
        console.log('Loaded visits:', visitsData)
      }
    } catch (err) {
      console.error('Error in fetchData:', err)
      setError('Error loading data')
    }
  }

  const handleVisit = async (restaurantId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Handling visit for user:', user)
      
      if (!user) {
        console.error('User not authenticated')
        setError('Please log in to check in at restaurants')
        return
      }

      // Check if already visited
      if (visits.some(visit => visit.restaurantId === restaurantId)) {
        setError('You have already visited this restaurant')
        return
      }

      // Create service role client
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Record the visit with a UUID using service role client
      const { data: visit, error: visitError } = await serviceClient
        .from('RestaurantVisit')
        .insert([
          { 
            id: uuidv4(),
            userId: user.id, 
            restaurantId 
          }
        ])
        .select()
        .single()

      if (visitError) {
        console.error('Error recording visit:', visitError)
        setError('Error recording visit')
        return
      }

      // Update visits state
      setVisits([...visits, visit])
      console.log('Recorded visit:', visit)

      // Check for raffle entries (every 5 visits)
      const totalVisits = visits.length + 1
      if (totalVisits % 5 === 0) {
        const { error: raffleError } = await serviceClient
          .from('RaffleEntry')
          .insert([
            { 
              id: uuidv4(),
              userId: user.id, 
              squares: totalVisits 
            }
          ])

        if (raffleError) {
          console.error('Error recording raffle entry:', raffleError)
        }
      }
    } catch (err) {
      console.error('Error in handleVisit:', err)
      setError('Error recording visit')
    }
  }

  const toggleScanner = () => {
    console.log('Toggling scanner, current state:', showScanner)
    setShowScanner(!showScanner)
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Restaurant Week Bingo</h1>
        <button
          onClick={toggleScanner}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          {showScanner ? 'Hide Scanner' : 'Check In'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {showScanner && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Check In</h2>
          <RestaurantCodeScanner onVisit={handleVisit} />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Bingo Card</h2>
          <BingoCard restaurants={restaurants} visits={visits} />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Restaurant Map</h2>
          <div className="h-[500px]">
            <RestaurantMap restaurants={restaurants} visits={visits} />
          </div>
        </div>
      </div>
    </div>
  )
} 