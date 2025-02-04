'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

export default function NavBar() {
  const { isLoggedIn, signOut } = useAuth()
  const router = useRouter()

  const handleAuthClick = async () => {
    if (isLoggedIn) {
      await signOut()
    } else {
      router.push('/')
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex-shrink-0">
              <span className="text-lg font-semibold text-gray-900">Restaurant Week Bingo</span>
            </Link>
            <Link href="/how-to-play" className="text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors">
              How to Play
            </Link>
          </div>
          <button
            onClick={handleAuthClick}
            className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-coral-500 transition-colors"
          >
            {isLoggedIn ? 'Sign Out' : 'Sign In'}
          </button>
        </div>
      </div>
    </nav>
  )
}
