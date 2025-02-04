'use client'

import { FaHandshake } from 'react-icons/fa'

export default function SponsorsPage() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FaHandshake className="text-5xl text-coral-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Sponsors</h1>
          <p className="text-lg text-gray-600">
            Thank you to the amazing businesses that make Restaurant Week Bingo possible
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="text-center">
            <p className="text-gray-600 mb-8">
              Sponsor information coming soon! If you're interested in becoming a sponsor,
              please contact the Pleasure Island Chamber of Commerce.
            </p>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((placeholder) => (
                <div
                  key={placeholder}
                  className="bg-gray-50 rounded-lg p-6 animate-pulse"
                >
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Want to join our community of sponsors? Contact us to learn more about sponsorship opportunities.
          </p>
        </div>
      </div>
    </div>
  )
} 