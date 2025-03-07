'use client'

import { FaMapMarkerAlt, FaPhone } from 'react-icons/fa'

export default function ContactPage() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto pt-3 pb-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600">Get in touch with the Pleasure Island Chamber of Commerce</p>
        </div>

        <div className="card p-8 md:p-12 border-l-4 border-[#ff5436]">
          <div className="grid gap-8 md:gap-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-coral-600 mb-2">
                Pleasure Island Chamber of Commerce
              </h2>
              <div className="flex items-center justify-center space-x-2 text-gray-700 mb-4">
                <FaMapMarkerAlt className="text-coral-500" />
                <span>1121 N Lake Park Blvd.</span>
              </div>
              <p className="text-gray-600">Carolina Beach, NC 28428</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-coral-600 hover:text-coral-700 transition-colors">
                <FaPhone className="text-coral-500" />
                <a href="tel:+19104588434" className="text-lg font-medium">
                  (910) 458-8434
                </a>
              </div>
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