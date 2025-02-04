'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { useAuth } from '@/lib/AuthContext';
import { DatabaseService } from '@/lib/services/database';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn?: () => void;
}

type DatabaseError = {
  message?: string;
  code?: string;
};

export default function CheckInModal({ isOpen, onClose, onCheckIn }: CheckInModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'manual' | 'qr'>('manual');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const handleCheckIn = useCallback(async (checkInCode: string) => {
    setLoading(true);
    setMessage('');

    try {
      if (!user) {
        setMessage('Please log in to check in.');
        return;
      }

      if (!checkInCode.trim()) {
        setMessage('Please enter a restaurant code.');
        return;
      }

      try {
        const restaurant = await DatabaseService.restaurants.getByCode(checkInCode);
        
        const alreadyVisited = await DatabaseService.visits.checkExists(user.id, restaurant.id);
        if (alreadyVisited) {
          setMessage('You have already checked in at this restaurant!');
          return;
        }

        await DatabaseService.visits.create(user.id, restaurant.id);
        setMessage(`Check-in successful at ${restaurant.name}!`);
        setCode('');
        onCheckIn?.();
        
        // Close modal after successful check-in
        setTimeout(() => {
          onClose();
          setMessage('');
        }, 2000);
      } catch (error) {
        const dbError = error as DatabaseError;
        if (dbError.message?.includes('No data returned') || dbError.code === 'PGRST116') {
          setMessage('Invalid restaurant code. Please check the code and try again.');
        } else if (dbError.code === '23505') { // Unique constraint violation
          setMessage('You have already checked in at this restaurant!');
        } else if (dbError.code === '42501') { // RLS policy violation
          setMessage('You do not have permission to check in. Please log in again.');
        } else if (dbError.code?.startsWith('23')) { // Other database constraint errors
          setMessage('Unable to check in. Please try again later.');
        } else {
          console.error('Unexpected error during check-in:', dbError);
          setMessage('An error occurred. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, onCheckIn, onClose]);

  useEffect(() => {
    if (mode === 'qr' && videoRef.current) {
      const codeReader = new BrowserQRCodeReader();
      
      const startScanning = async () => {
        try {
          // Get available video devices
          const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
          
          // Use the back camera by default (usually the last device)
          const deviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;
          
          // Start scanning
          const controls = await codeReader.decodeFromVideoDevice(
            deviceId,
            videoRef.current!,
            (result) => {
              if (result) {
                handleCheckIn(result.getText());
                setMode('manual');
              }
            }
          );
          
          controlsRef.current = controls;
        } catch (error) {
          console.error('Error starting QR scanner:', error);
          setMessage('Unable to start camera. Please try manual entry.');
          setMode('manual');
        }
      };

      startScanning();

      return () => {
        controlsRef.current?.stop();
      };
    }
  }, [mode, handleCheckIn]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Check In</h2>
          <button
            onClick={() => {
              controlsRef.current?.stop();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'manual'
                ? 'bg-coral-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Enter Code
          </button>
          <button
            onClick={() => setMode('qr')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'qr'
                ? 'bg-coral-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Scan QR
          </button>
        </div>

        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="input w-full"
                placeholder="Enter code"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Checking in...' : 'Submit'}
            </button>
          </form>
        ) : (
          <div className="w-full">
            <video 
              ref={videoRef}
              className="w-full aspect-square object-cover rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Position the QR code within the camera view
            </p>
          </div>
        )}

        {message && (
          <p className={`mt-4 text-sm text-center ${
            message.includes('successful') ? 'text-coral-600' : 'text-red-600'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
} 