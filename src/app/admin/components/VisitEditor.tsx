interface Restaurant {
  id: string;
  name: string;
  code: string;
}

interface Props {
  restaurants: Restaurant[];
  pendingChanges: Map<string, boolean>;
  onVisitToggle: (restaurantId: string, checked: boolean) => void;
}

export default function VisitEditor({ restaurants, pendingChanges, onVisitToggle }: Props) {
  // Sort restaurants alphabetically
  const sortedRestaurants = [...restaurants].sort((a, b) => a.name.localeCompare(b.name));

  // Count checked restaurants
  const checkedCount = Array.from(pendingChanges.values()).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div>
          <span className="text-lg font-semibold text-gray-900">
            {checkedCount} of {restaurants.length} restaurants selected
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              restaurants.forEach(restaurant => {
                onVisitToggle(restaurant.id, true);
              });
            }}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
          >
            Select All
          </button>
          <button
            onClick={() => {
              restaurants.forEach(restaurant => {
                onVisitToggle(restaurant.id, false);
              });
            }}
            className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedRestaurants.map((restaurant) => {
          const isChecked = pendingChanges.get(restaurant.id) || false;
          
          return (
            <div
              key={restaurant.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isChecked
                  ? 'border-coral-300 bg-coral-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onVisitToggle(restaurant.id, !isChecked)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onVisitToggle(restaurant.id, e.target.checked)}
                    className="h-5 w-5 text-coral-600 focus:ring-coral-500 border-gray-300 rounded cursor-pointer"
                    onClick={(e) => e.stopPropagation()} // Prevent double-toggle
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {restaurant.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Code: <span className="font-mono">{restaurant.code}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {restaurants.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No restaurants found
        </div>
      )}
    </div>
  );
}