'use client'

import { FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

export default function ContactPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto pt-3 pb-6">
        <div className="text-center mb-12">
          <img
            src="/PICC-logo.png"
            alt="PICC Logo"
            className="h-32 mb-6 mx-auto"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
        </div>

        <div className="card p-8 md:p-12 border-l-4 border-[#ff5436] bg-white shadow-sm max-w-xl mx-auto">
          <div className="grid gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 text-gray-700 mb-2">
                <FaMapMarkerAlt className="text-coral-500 text-xl" />
                <span className="text-lg">1121 N Lake Park Blvd</span>
              </div>
              <p className="text-gray-600 text-lg">Carolina Beach, NC 28428</p>
            </div>

            <div className="text-center">
              <a href="tel:+19104588434" 
                 className="inline-flex items-center space-x-3 text-coral-600 hover:text-coral-700 transition-colors text-lg">
                <FaPhone className="text-coral-500 text-xl" />
                <span className="font-medium">(910) 458-8434</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Join us in celebrating the amazing restaurants of Pleasure Island!
          </p>
        </div>
      </div>
    </div>
  )
} 