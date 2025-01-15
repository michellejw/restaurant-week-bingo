'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'

interface RestaurantCodeScannerProps {
  onVisit: (restaurantId: string) => void
}

export default function RestaurantCodeScanner({ onVisit }: RestaurantCodeScannerProps) {
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (!scannerRef.current && isScanning) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scannerRef.current.render(handleScan, handleError)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [isScanning])

  const handleScan = async (decodedText: string) => {
    await processCode(decodedText)
  }

  const handleError = (err: any) => {
    console.error(err)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await processCode(manualCode)
    setManualCode('')
  }

  const processCode = async (code: string) => {
    setError('')
    setSuccess('')
    console.log('Processing code:', code)

    try {
      // Find restaurant by code
      const { data: restaurant, error: restaurantError } = await supabase
        .from('Restaurant')
        .select('id, name')
        .eq('code', code.trim().toUpperCase())
        .single()

      console.log('Query result:', { restaurant, restaurantError })

      if (restaurantError) {
        console.error('Restaurant query error:', restaurantError)
        setError('Error finding restaurant')
        return
      }

      if (!restaurant) {
        setError('Invalid restaurant code')
        return
      }

      onVisit(restaurant.id)
      setSuccess(`Successfully checked in at ${restaurant.name}!`)
      
      // Stop scanning after successful scan
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
        setIsScanning(false)
      }
    } catch (err) {
      console.error('Error processing code:', err)
      setError('Error processing code')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <form onSubmit={handleManualSubmit} className="flex space-x-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Enter restaurant code"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Submit
          </button>
        </form>

        <div className="flex justify-center">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {isScanning ? 'Stop Scanning' : 'Scan QR Code'}
          </button>
        </div>
      </div>

      {isScanning && <div id="qr-reader" className="w-full max-w-sm mx-auto" />}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}
    </div>
  )
} 