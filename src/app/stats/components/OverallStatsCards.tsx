interface OverallStats {
  totalVisits: number;
  totalUsers: number;
  totalRestaurants: number;
  avgVisitsPerUser: number;
}

interface Props {
  stats: OverallStats;
}

export default function OverallStatsCards({ stats }: Props) {
  const statCards = [
    {
      title: 'Total Visits',
      value: stats.totalVisits.toLocaleString(),
      icon: '📍',
      color: 'bg-coral-100 text-coral-900',
    },
    {
      title: 'Active Users',
      value: stats.totalUsers.toLocaleString(),
      icon: '👥',
      color: 'bg-blue-100 text-blue-900',
    },
    {
      title: 'Restaurants',
      value: stats.totalRestaurants.toLocaleString(),
      icon: '🍽️',
      color: 'bg-green-100 text-green-900',
    },
    {
      title: 'Avg Visits/User',
      value: stats.avgVisitsPerUser.toString(),
      icon: '📊',
      color: 'bg-purple-100 text-purple-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <div
          key={index}
          className={`${card.color} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">{card.icon}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-80">{card.title}</p>
            <p className="text-2xl font-bold">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}