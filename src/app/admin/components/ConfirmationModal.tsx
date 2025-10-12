interface VisitChange {
  restaurantId: string;
  restaurantName: string;
  action: 'add' | 'remove';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: VisitChange[];
  userName: string;
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, changes, userName }: Props) {
  if (!isOpen) return null;

  const addChanges = changes.filter(c => c.action === 'add');
  const removeChanges = changes.filter(c => c.action === 'remove');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Confirm Changes
            </h3>
            <p className="text-gray-600 mt-1">
              Review changes for <span className="font-medium">{userName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Changes Summary */}
        <div className="space-y-6">
          {addChanges.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Visits ({addChanges.length})
              </h4>
              <div className="space-y-2">
                {addChanges.map((change, index) => (
                  <div key={`add-${index}`} className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex-grow">
                      <span className="font-medium text-green-900">{change.restaurantName}</span>
                    </div>
                    <div className="text-sm text-green-600">
                      + Add visit
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {removeChanges.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Remove Visits ({removeChanges.length})
              </h4>
              <div className="space-y-2">
                {removeChanges.map((change, index) => (
                  <div key={`remove-${index}`} className="flex items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex-grow">
                      <span className="font-medium text-red-900">{change.restaurantName}</span>
                    </div>
                    <div className="text-sm text-red-600">
                      - Remove visit
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {changes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No changes to apply
            </div>
          )}
        </div>

        {/* Impact Warning */}
        {changes.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h5 className="font-medium text-yellow-800">Impact</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  These changes will update the user&apos;s visit count and raffle entries.
                  User statistics will be automatically recalculated by database triggers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={changes.length === 0}
            className="px-6 py-3 bg-coral-600 text-white rounded-lg hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Changes ({changes.length})
          </button>
        </div>
      </div>
    </div>
  );
}