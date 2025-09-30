'use client';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn?: () => void;
}

export default function CheckInModal({ isOpen, onClose, onCheckIn }: CheckInModalProps) {
  if (!isOpen) return null;

  // Check if we're in dev environment
  const isDevEnvironment = typeof window !== 'undefined' && 
    (process.env.NODE_ENV === 'development' || 
     window.location.hostname.includes('vercel.app'));

  if (isDevEnvironment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Check In to Restaurant</h2>
          <p className="text-gray-600 mb-6">
            Enter the restaurant&apos;s unique code to check in and earn progress toward raffle entries!
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (onCheckIn) onCheckIn();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-coral-600 rounded-md hover:bg-coral-700"
            >
              Check In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Production modal (Restaurant Week is over)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thanks For A Great Restaurant Week!</h2>
        <p className="text-gray-600 mb-6">
          We hope you enjoyed discovering Pleasure Island&apos;s amazing restaurants! While check-ins are now closed, 
          we encourage you to keep supporting our local restaurants throughout the year. See you next fall for 
          more delicious adventures!
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 