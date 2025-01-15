'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        checkAdminStatus(user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdminStatus(session.user.id)
      } else {
        setIsAdmin(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('isAdmin')
      .eq('id', userId)
      .single()
    setIsAdmin(data?.isAdmin ?? false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-purple-600">Restaurant Bingo</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-purple-600"
                >
                  Dashboard
                </Link>
                
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-purple-600"
                  >
                    Admin
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-purple-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-gray-700 hover:text-purple-600"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 