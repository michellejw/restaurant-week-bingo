'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa'
import { checkSession } from '@/lib/supabase'

export default function NavBar() {
  const { isLoggedIn, signOut } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleAuthClick = async () => {
    if (isLoggedIn) {
      await signOut()
    } else {
      router.push('/')
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-lg font-semibold text-gray-900">Restaurant Week Bingo</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/how-to-play" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors">
              How to Play
            </Link>
            <Link href="/sponsors" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors">
              Sponsors
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors">
              Contact Us
            </Link>
            {isLoggedIn && (
              <button
                onClick={() => checkSession()}
                className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors"
              >
                Check Session
              </button>
            )}
            <button
              onClick={handleAuthClick}
              className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors"
            >
              {isLoggedIn ? 'Sign Out' : 'Sign In'}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-coral-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coral-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white/80 backdrop-blur-sm">
          <Link
            href="/how-to-play"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            How to Play
          </Link>
          <Link
            href="/sponsors"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Sponsors
          </Link>
          <Link
            href="/contact"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact Us
          </Link>
          <button
            onClick={() => {
              handleAuthClick()
              setIsMenuOpen(false)
            }}
            className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
          >
            {isLoggedIn ? 'Sign Out' : 'Sign In'}
          </button>
        </div>
      </div>
    </nav>
  )
}
