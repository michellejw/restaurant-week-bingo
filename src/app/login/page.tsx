'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      router.push('/dashboard')
      return
    }
    setIsLoading(false)
  }

  const createUserRecord = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user record')
      }
    } catch (err) {
      console.error('Error creating user record:', err)
      throw err
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        // Sign Up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          setError(signUpError.message)
        } else if (signUpData.user) {
          try {
            await createUserRecord(signUpData.user.id, signUpData.user.email!)
            setMessage('Please check your email to confirm your account before logging in. After confirming, you can sign in.')
            setIsSignUp(false) // Switch back to sign in mode
          } catch (err) {
            console.error('Error creating user record:', err)
            setError('Error creating user account')
          }
        }
      } else {
        // Sign In
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.')
          } else {
            setError(signInError.message)
          }
        } else if (signInData.user) {
          try {
            // Try to create user record in case it doesn't exist
            await createUserRecord(signInData.user.id, signInData.user.email!)
          } catch (err) {
            // Ignore error if user already exists
            console.log('User record might already exist:', err)
          }
          router.push('/dashboard')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('An error occurred during authentication')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render form if checking session or already logged in
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-8">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setMessage('')
            }}
            className="text-sm text-purple-600 hover:text-purple-500"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : 'Need an account? Sign up'}
          </button>
        </div>
      </form>
    </div>
  )
} 