'use client'

import Link from 'next/link'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa'

export default function NavBar() {
  const { user } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 fixed w-full top-0 z-[55]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-lg font-semibold text-gray-900">Restaurant Week Bingo</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/how-to-play" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors whitespace-nowrap">
                How to Play
              </Link>
              <Link href="/sponsors" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors whitespace-nowrap">
                Sponsors
              </Link>
              <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors whitespace-nowrap">
                Contact Us
              </Link>
              {user && (
                <Link href="/my-info" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors whitespace-nowrap">
                  My Info
                </Link>
              )}
              {!user && (
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors whitespace-nowrap">
                    Sign In
                  </button>
                </SignInButton>
              )}
              {user && <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-coral-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-coral-500"
            >
              <span className="sr-only">{isMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
              {isMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu - moved outside nav */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000]" onClick={closeMenu}>
          <div className="fixed top-16 left-0 right-0 bg-white shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="py-2 space-y-1">
              <Link
                href="/how-to-play"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
                onClick={closeMenu}
              >
                How to Play
              </Link>
              <Link
                href="/sponsors"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
                onClick={closeMenu}
              >
                Sponsors
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
                onClick={closeMenu}
              >
                Contact Us
              </Link>
              {user && (
                <Link
                  href="/my-info"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
                  onClick={closeMenu}
                >
                  My Info
                </Link>
              )}
              {!user && (
                <SignInButton mode="modal">
                  <button
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-coral-500 hover:bg-gray-50 transition-colors"
                    onClick={closeMenu}
                  >
                    Sign In
                  </button>
                </SignInButton>
              )}
              {user && (
                <div className="px-3 py-2">
                  <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
