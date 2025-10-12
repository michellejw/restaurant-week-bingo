interface UserEngagement {
  visitRange: string;
  userCount: number;
}

interface Props {
  data: UserEngagement[];
}

export default function UserEngagementChart({ data }: Props) {
  const maxUsers = Math.max(...data.map(d => d.userCount), 1);
  const totalUsers = data.reduce((sum, d) => sum + d.userCount, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-coral-900 mb-2">
          User Engagement Histogram
        </h3>
        <p className="text-sm text-coral-700">
          Distribution of users by visit count
        </p>
      </div>

      {/* Histogram */}
      <div className="relative h-64 mb-4">
        <div className="absolute inset-0 flex items-end justify-center space-x-2">
          {data.map((item, index) => {
            const height = (item.userCount / maxUsers) * 100;
            const percentage = totalUsers > 0 ? (item.userCount / totalUsers) * 100 : 0;
            
            const colors = [
              'bg-gradient-to-t from-coral-400 to-coral-300',
              'bg-gradient-to-t from-orange-400 to-orange-300',
              'bg-gradient-to-t from-yellow-400 to-yellow-300', 
              'bg-gradient-to-t from-green-400 to-green-300',
              'bg-gradient-to-t from-blue-400 to-blue-300',
            ];

            return (
              <div key={item.visitRange} className="flex flex-col items-center flex-1">
                <div className="relative w-full max-w-16 group">
                  {/* Bar */}
                  <div
                    className={`w-full ${colors[index % colors.length]} rounded-t-lg border border-gray-300 transition-all duration-500 hover:opacity-80 cursor-pointer`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${item.visitRange}: ${item.userCount} users (${percentage.toFixed(1)}%)`}
                  >
                    {/* Value label on top of bar */}
                    {item.userCount > 0 && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-sm border">
                        {item.userCount}
                      </div>
                    )}
                  </div>
                  
                  {/* Always show count at bottom */}
                  <div className="text-center mt-1">
                    <div className="text-sm font-bold text-gray-900">
                      {item.userCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>{maxUsers}</span>
          <span>{Math.round(maxUsers * 0.75)}</span>
          <span>{Math.round(maxUsers * 0.5)}</span>
          <span>{Math.round(maxUsers * 0.25)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-center space-x-2 mb-4">
        {data.map((item) => (
          <div key={item.visitRange} className="flex-1 text-center max-w-16">
            <div className="text-xs text-gray-600 font-medium transform -rotate-12 origin-center">
              {item.visitRange}
            </div>
          </div>
        ))}
      </div>

      {totalUsers > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold">{totalUsers}</span> users
          </p>
        </div>
      )}
    </div>
  );
}
