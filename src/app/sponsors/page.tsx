'use client'

import { FaHandshake } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Sponsor = Database['public']['Tables']['sponsors']['Row']

interface SupabaseError {
  name?: string
  message: string
  code?: string
  details?: string
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSponsors() {
      console.log('Starting to fetch sponsors...')
      try {
        // Log the current auth state
        const { data: authData } = await supabase.auth.getSession()
        console.log('Current auth state:', authData)

        // Simple query to get all sponsors with detailed logging
        console.log('Executing sponsors query...')
        const { data, error, status, statusText, count } = await supabase
          .from('sponsors')
          .select('*', { count: 'exact' })

        console.log('Complete Supabase response:', {
          status,
          statusText,
          count,
          data,
          error,
          hasData: !!data,
          dataLength: data?.length
        })

        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }

        if (!data || data.length === 0) {
          console.log('No sponsors found in the database')
          setSponsors([])
        } else {
          console.log('Successfully fetched sponsors:', JSON.stringify(data, null, 2))
          setSponsors(data)
        }
      } catch (err: unknown) {
        const supabaseError = err as SupabaseError
        console.error('Error details:', {
          name: supabaseError.name,
          message: supabaseError.message,
          code: supabaseError.code,
          details: supabaseError.details
        })
        setError(supabaseError.message || 'Failed to load sponsors. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSponsors()
  }, [])

  // Add debug output for render state
  console.log('Render state:', { isLoading, error, sponsorsCount: sponsors.length })

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FaHandshake className="text-5xl text-coral-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Sponsors</h1>
          <p className="text-lg text-gray-600">
            Restaurant Week Bingo is sponsored by amazing local businesses invested in Pleasure Island&apos;s success.
            We hope you enjoy your exploration of the hottest dishes and coolest spots in Carolina Beach & Kure Beach
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sponsors...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="card p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="card p-8 hover:shadow-lg transition-shadow duration-300 border-l-4 border-[#ff5436]"
                >
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{sponsor.name}</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{sponsor.address}</p>
                    {sponsor.phone && (
                      <p className="text-sm text-gray-600">{sponsor.phone}</p>
                    )}
                    {sponsor.url && (
                      <a 
                        href={`https://${sponsor.url}`} 
                        className="text-sm text-coral-500 hover:text-coral-600 block"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {sponsor.url}
                      </a>
                    )}
                    {sponsor.description && (
                      <p className="text-sm text-gray-700">{sponsor.description}</p>
                    )}
                    {sponsor.promo_offer && (
                      <div className="bg-coral-50 p-4 rounded-lg mt-4">
                        <p className="text-sm font-medium text-coral-700">
                          Special Offer: {sponsor.promo_offer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Want to join our community of sponsors? Contact us to learn more about sponsorship opportunities.
          </p>
        </div>
      </div>
    </div>
  )
} 