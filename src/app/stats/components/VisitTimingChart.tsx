interface VisitTiming {
  hour: number;
  visits: number;
}

interface Props {
  data: VisitTiming[];
}

export default function VisitTimingChart({ data }: Props) {
  const maxVisits = Math.max(...data.map(d => d.visits), 1);
  
  // Create a full 24-hour array with data
  const fullDayData = Array.from({ length: 24 }, (_, hour) => {
    const existingData = data.find(d => d.hour === hour);
    return {
      hour,
      visits: existingData?.visits || 0,
    };
  });

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getTimeOfDay = (hour: number) => {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 22) return 'Evening';
    return 'Night';
  };

  const getBarColor = (hour: number) => {
    const timeOfDay = getTimeOfDay(hour);
    switch (timeOfDay) {
      case 'Morning': return 'bg-gradient-to-r from-yellow-400 to-yellow-300';
      case 'Afternoon': return 'bg-gradient-to-r from-orange-400 to-orange-300';
      case 'Evening': return 'bg-gradient-to-r from-coral-400 to-coral-300';
      default: return 'bg-gradient-to-r from-blue-400 to-blue-300';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-coral-900 mb-2">
          Visit Timing Histogram
        </h3>
        <p className="text-sm text-coral-700">
          Number of visits by hour of day
        </p>
      </div>

      {/* Vertical histogram with better spacing */}
      <div className="relative h-72 mb-6">
        <div className="absolute inset-0 flex items-end justify-center">
          {fullDayData.map((item) => {
            const height = item.visits > 0 ? (item.visits / maxVisits) * 100 : 1;
            const isActive = item.visits > 0;
            
            return (
              <div key={item.hour} className="flex-1 flex flex-col items-center group px-px">
                <div className="w-full max-w-6 relative">
                  <div
                    className={`w-full rounded-t border transition-all duration-300 hover:opacity-80 cursor-pointer ${
                      isActive ? `${getBarColor(item.hour)} border-gray-400` : 'bg-gray-100 border-gray-200'
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${formatHour(item.hour)}: ${item.visits} visits`}
                  >
                    {/* Hover tooltip */}
                    {item.visits > 0 && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {formatHour(item.hour)}: {item.visits}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>{maxVisits}</span>
          <span>{Math.round(maxVisits * 0.75)}</span>
          <span>{Math.round(maxVisits * 0.5)}</span>
          <span>{Math.round(maxVisits * 0.25)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis time labels */}
      <div className="flex justify-between items-center text-xs text-gray-500 mb-4 px-2">
        <span className="font-medium">12 AM</span>
        <span>3 AM</span>
        <span>6 AM</span>
        <span>9 AM</span>
        <span className="font-medium">12 PM</span>
        <span>3 PM</span>
        <span>6 PM</span>
        <span>9 PM</span>
        <span>11 PM</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Morning (5AM-12PM)', period: 'morning', hours: [5,6,7,8,9,10,11] },
          { label: 'Afternoon (12PM-5PM)', period: 'afternoon', hours: [12,13,14,15,16] },
          { label: 'Evening (5PM-10PM)', period: 'evening', hours: [17,18,19,20,21] },
          { label: 'Night (10PM-5AM)', period: 'night', hours: [22,23,0,1,2,3,4] },
        ].map((timeSlot) => {
          const visits = timeSlot.hours.reduce((sum, hour) => {
            const hourData = fullDayData.find(d => d.hour === hour);
            return sum + (hourData?.visits || 0);
          }, 0);
          const color = getBarColor(timeSlot.hours[0]);
          
          return (
            <div key={timeSlot.period} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={`w-4 h-4 ${color} rounded mx-auto mb-1`} />
              <div className="text-xs text-gray-600 font-medium mb-1">
                {timeSlot.period.charAt(0).toUpperCase() + timeSlot.period.slice(1)}
              </div>
              <div className="text-lg font-bold text-gray-900">{visits}</div>
              <div className="text-xs text-gray-500">visits</div>
            </div>
          );
        })}
      </div>

      {/* Peak hour info */}
      {data.length > 0 && (
        <div className="text-center pt-4 border-t border-gray-200">
          {(() => {
            const peakHour = fullDayData.reduce((prev, current) => 
              prev.visits > current.visits ? prev : current
            );
            return (
              <p className="text-sm text-gray-600">
                Peak hour: <span className="font-semibold">{formatHour(peakHour.hour)}</span> with <span className="font-semibold">{peakHour.visits}</span> visits
              </p>
            );
          })()} 
        </div>
      )}
    </div>
  );
}
