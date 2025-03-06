'use client';

import React, { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'

const ResetPasswordPage: NextPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [successfulCreation, setSuccessfulCreation] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)

  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()

  if (!isLoaded) {
    return null
  }

  // Send the password reset code to the user's email
  async function create(e: React.FormEvent) {
    e.preventDefault()
    await signIn
      ?.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      .then((_) => {
        setSuccessfulCreation(true)
        setError('')
      })
      .catch((err) => {
        console.error('error', err.errors[0].longMessage)
        setError(err.errors[0].longMessage)
      })
  }

  // Reset the user's password
  async function reset(e: React.FormEvent) {
    e.preventDefault()
    await signIn
      ?.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })
      .then((result) => {
        if (result.status === 'complete') {
          setComplete(true)
          // Redirect to sign-in page after successful password reset
          setTimeout(() => {
            router.push('/sign-in')
          }, 2000)
        } else {
          console.log(result)
        }
      })
      .catch((err) => {
        console.error('error', err.errors[0].longMessage)
        setError(err.errors[0].longMessage)
      })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-center text-2xl font-bold">Reset Password</h1>
        
        {complete ? (
          <div className="text-center">
            <p className="text-green-600">Password reset successful!</p>
            <p className="text-sm text-gray-600">Redirecting to sign in...</p>
          </div>
        ) : (
          <form onSubmit={!successfulCreation ? create : reset} className="space-y-6">
            {!successfulCreation ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Send Reset Code
                </button>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    placeholder="Enter the code from your email"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Reset Password
                </button>
              </>
            )}
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage 