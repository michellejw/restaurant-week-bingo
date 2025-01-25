'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NavBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    
    checkAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleAuthClick = async () => {
    if (isLoggedIn) {
      await supabase.auth.signOut()
      router.refresh()
    } else {
      router.push('/')
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex-shrink-0">
            <span className="text-lg font-semibold text-gray-900">Restaurant Week Bingo</span>
          </Link>
          {isLoggedIn && (
            <button
              onClick={handleAuthClick}
              className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  )
} 