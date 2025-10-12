interface RestaurantVisit {
  name: string;
  visits: number;
  id: string;
}

interface Props {
  data: RestaurantVisit[];
}

export default function RestaurantVisitsChart({ data }: Props) {
  const maxVisits = Math.max(...data.map(d => d.visits), 1);
  const topRestaurants = data.slice(0, 15); // Show top 15

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-coral-900 mb-2">
          Restaurant Popularity
        </h3>
        <p className="text-sm text-coral-700">
          Number of visits per restaurant (top 15)
        </p>
      </div>

      <div className="space-y-3">
        {topRestaurants.map((restaurant, index) => {
          const percentage = (restaurant.visits / maxVisits) * 100;
          const isTop3 = index < 3;
          
          return (
            <div key={restaurant.id} className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {isTop3 && (
                    <span className="text-sm">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate max-w-48">
                    {restaurant.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-coral-700 ml-2">
                  {restaurant.visits}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isTop3 
                      ? 'bg-gradient-to-r from-coral-500 to-coral-400' 
                      : 'bg-coral-300'
                  }`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 15 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing top 15 of {data.length} restaurants
          </p>
        </div>
      )}
    </div>
  );
}