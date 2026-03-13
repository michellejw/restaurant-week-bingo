interface OverallStats {
  totalVisits: number;
  checkedIn: number;
  openedApp: number;
  newAccounts: number;
  totalRestaurants: number;
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
      title: 'Checked In',
      value: stats.checkedIn.toLocaleString(),
      icon: '👥',
      color: 'bg-blue-100 text-blue-900',
    },
    {
      title: 'Opened App',
      value: stats.openedApp.toLocaleString(),
      icon: '📱',
      color: 'bg-yellow-100 text-yellow-900',
    },
    {
      title: 'New Accounts',
      value: stats.newAccounts.toLocaleString(),
      icon: '✨',
      color: 'bg-purple-100 text-purple-900',
    },
    {
      title: 'Restaurants',
      value: stats.totalRestaurants.toLocaleString(),
      icon: '🍽️',
      color: 'bg-green-100 text-green-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
