'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';

interface RecordVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordVisitModal({ isOpen, onClose }: RecordVisitModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'scan' | 'code'>('select');
  const [shortCode, setShortCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQRCodeScanned = (detectedCodes: IDetectedBarcode[]) => {
    if (!detectedCodes.length) return;
    const result = detectedCodes[0].rawValue;
    // Extract restaurant ID from QR code URL
    const match = result.match(/\/visit\/([^\/]+)$/);
    if (match) {
      const restaurantId = match[1];
      router.push(`/visit/${restaurantId}`);
      onClose();
    } else {
      setError('Invalid QR code');
    }
  };

  const handleShortCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/visits/code/${shortCode}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid code');
      }
      const { restaurantId } = await response.json();
      router.push(`/visit/${restaurantId}`);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Record Your Visit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose how you'd like to record your visit:
            </p>
            <button
              onClick={() => setMode('scan')}
              className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Scan QR Code
            </button>
            <button
              onClick={() => setMode('code')}
              className="w-full p-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Enter Short Code
            </button>
          </div>
        )}

        {mode === 'scan' && (
          <div>
            <button
              onClick={() => setMode('select')}
              className="mb-4 text-blue-600 hover:text-blue-700"
            >
              ← Back
            </button>
            <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
              <Scanner
                onScan={handleQRCodeScanned}
                onError={(error: unknown) => setError(error instanceof Error ? error.message : 'Failed to scan QR code')}
              />
            </div>
          </div>
        )}

        {mode === 'code' && (
          <div>
            <button
              onClick={() => setMode('select')}
              className="mb-4 text-blue-600 hover:text-blue-700"
            >
              ← Back
            </button>
            <form onSubmit={handleShortCodeSubmit}>
              <div className="mb-4">
                <label htmlFor="shortCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter the 6-character code:
                </label>
                <input
                  type="text"
                  id="shortCode"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter code (e.g., ABC123)"
                  maxLength={6}
                  pattern="[A-Z0-9]{6}"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || shortCode.length !== 6}
                className={`w-full p-3 bg-blue-600 text-white rounded-md ${
                  loading || shortCode.length !== 6
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700'
                }`}
              >
                {loading ? 'Verifying...' : 'Submit Code'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 