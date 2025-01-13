'use client';

import { useEffect, useState } from 'react';
import { Restaurant } from '@/types/restaurant';
import { getAllRestaurants } from '@/utils/restaurants';
import QRCode from 'qrcode';

export default function GenerateQRCodes() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ restaurantId: string; qrCode: string } | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getAllRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setError('Failed to load restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const generateQRCode = async (restaurantId: string) => {
    try {
      setGeneratingQR(restaurantId);
      setError(null);

      const response = await fetch('/api/admin/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate QR code');
      }

      const updatedRestaurant = await response.json();
      
      // Update the restaurants list with the new QR code
      setRestaurants(restaurants.map(restaurant => 
        restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant
      ));

      // Show the QR code preview
      setSelectedQR({
        restaurantId,
        qrCode: updatedRestaurant.qr_code
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setGeneratingQR(null);
    }
  };

  const downloadQRCode = (restaurantId: string, qrCode: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-code-${restaurantId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-600">Loading restaurants...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Generate QR Codes</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {selectedQR && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-start space-x-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <img 
                src={selectedQR.qrCode} 
                alt="QR Code" 
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">
                {restaurants.find(r => r.id === selectedQR.restaurantId)?.name} QR Code
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                This QR code has been saved and can be printed or shared digitally.
              </p>
              <button
                onClick={() => downloadQRCode(selectedQR.restaurantId, selectedQR.qrCode)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                QR Code Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {restaurant.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {restaurant.address}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    restaurant.qr_code 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {restaurant.qr_code ? 'Generated' : 'Not Generated'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => generateQRCode(restaurant.id)}
                      disabled={generatingQR === restaurant.id}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        generatingQR === restaurant.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {generatingQR === restaurant.id ? (
                        'Generating...'
                      ) : restaurant.qr_code ? (
                        'Regenerate QR'
                      ) : (
                        'Generate QR'
                      )}
                    </button>
                    {restaurant.qr_code && (
                      <button
                        onClick={() => setSelectedQR({ restaurantId: restaurant.id, qrCode: restaurant.qr_code! })}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View QR
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 