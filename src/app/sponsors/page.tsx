'use client'

import { FaHandshake } from 'react-icons/fa'
import Image from 'next/image'

interface Sponsor {
  id: number
  name: string
  address: string
  phone: string
  url: string
  description: string
  promoOffer: string
}

const sponsors: Sponsor[] = [
  {
    id: 1,
    name: "The Salty Seagull&apos;s Sandwiches",
    address: "123 Beach Drive, Carolina Beach, NC 28428",
    phone: "(910) 555-0123",
    url: "www.saltyseagull.example.com",
    description: "Home of the famous &lsquo;Gull-Wing&rsquo; sandwich, where every bite tastes like a vacation!",
    promoOffer: "Free beach-themed cookie with purchase of any signature sandwich during Restaurant Week"
  },
  {
    id: 2,
    name: "Flip Flop Fine Dining",
    address: "456 Boardwalk Way, Carolina Beach, NC 28428",
    phone: "(910) 555-0456",
    url: "www.flipflopdining.example.com",
    description: "Where barefoot luxury meets coastal cuisine. Yes, flip flops are encouraged!",
    promoOffer: "Complimentary signature mocktail with any entrée purchase"
  },
  {
    id: 3,
    name: "The Mermaid&apos;s Munchies",
    address: "789 Ocean Blvd, Carolina Beach, NC 28428",
    phone: "(910) 555-0789",
    url: "www.mermaidmunchies.example.com",
    description: "Serving whimsical seafood creations that would make Poseidon jealous",
    promoOffer: "Buy one &lsquo;Under the Sea&rsquo; platter, get a second at half price"
  }
]

export default function SponsorsPage() {
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

        <div className="card p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="card p-6 hover:shadow-lg transition-shadow duration-300 border-l-4 border-[#ff5436]"
              >
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src="/default-sponsor-logo.svg"
                    alt={`${sponsor.name} logo`}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{sponsor.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{sponsor.address}</p>
                <p className="text-sm text-gray-600 mb-2">{sponsor.phone}</p>
                <a 
                  href={`https://${sponsor.url}`} 
                  className="text-sm text-coral-500 hover:text-coral-600 mb-3 block"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {sponsor.url}
                </a>
                <p className="text-sm text-gray-700 mb-4">{sponsor.description}</p>
                <div className="bg-coral-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-coral-700">
                    Special Offer: {sponsor.promoOffer}
                  </p>
                </div>
              </div>
            ))}
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