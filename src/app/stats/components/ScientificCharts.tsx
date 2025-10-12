'use client';

import { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';

interface RestaurantData {
  name: string;
  visits: number;
  id: string;
}

interface VisitTimingData {
  hour: number;
  visits: number;
}

interface UserEngagementData {
  visitCount: number;
  userCount: number;
}

interface RawVisitData {
  created_at: string;
  restaurant_id: string;
}

interface ScientificChartsProps {
  restaurantData: RestaurantData[];
  visitTimingData: VisitTimingData[];
  userEngagementData: UserEngagementData[];
  rawVisits: RawVisitData[];
}

export function RestaurantPopularityHistogram({ data }: { data: RestaurantData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    const plot = Plot.plot({
      title: "Restaurant Visit Distribution",
      subtitle: "Frequency histogram of visits per restaurant",
      width: 800,
      height: 400,
      marginBottom: 80,
      x: {
        label: "Number of visits →",
        grid: true,
      },
      y: {
        label: "↑ Number of restaurants",
        grid: true,
      },
      color: {
        scheme: "viridis",
      },
      marks: [
        Plot.rectY(
          data,
          Plot.binX(
            { y: "count" },
            {
              x: "visits",
              fill: "visits",
              stroke: "white",
              strokeWidth: 1,
              rx: 2,
            }
          )
        ),
        Plot.ruleY([0]),
      ],
    });

    containerRef.current.appendChild(plot);
    return () => plot.remove();
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Distribution shows how restaurant popularity varies across the dataset.</p>
      </div>
    </div>
  );
}

export function VisitTimingHistogram({ data }: { data: VisitTimingData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    // Create 24-hour data with all hours represented
    const fullDayData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visits: data.find(d => d.hour === hour)?.visits || 0,
    }));

    const plot = Plot.plot({
      title: "Visit Timing Pattern",
      subtitle: "Temporal distribution of restaurant check-ins throughout the day",
      width: 900,
      height: 400,
      marginBottom: 60,
      x: {
        label: "Hour of day →",
        domain: [0, 23],
        ticks: 24,
        tickFormat: (d: number) => {
          if (d === 0) return "12 AM";
          if (d === 12) return "12 PM";
          if (d < 12) return `${d} AM`;
          return `${d - 12} PM`;
        },
      },
      y: {
        label: "↑ Number of visits",
        grid: true,
      },
      color: {
        type: "ordinal",
        domain: ["Night", "Morning", "Afternoon", "Evening"],
        range: ["#3b82f6", "#fbbf24", "#f97316", "#ef4444"],
      },
      marks: [
        Plot.rectY(fullDayData, {
          x: "hour",
          y: "visits",
          fill: (d: { hour: number }) => {
            if (d.hour >= 5 && d.hour < 12) return "Morning";
            if (d.hour >= 12 && d.hour < 17) return "Afternoon";
            if (d.hour >= 17 && d.hour < 22) return "Evening";
            return "Night";
          },
          stroke: "white",
          strokeWidth: 1,
        }),
        Plot.ruleY([0]),
      ],
    });

    containerRef.current.appendChild(plot);
    return () => plot.remove();
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Circadian pattern analysis reveals peak activity periods and temporal usage patterns.</p>
      </div>
    </div>
  );
}

export function UserEngagementDistribution({ data }: { data: UserEngagementData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    // Expand data for proper histogram
    const expandedData: number[] = [];
    data.forEach(item => {
      for (let i = 0; i < item.userCount; i++) {
        expandedData.push(item.visitCount);
      }
    });

    const plot = Plot.plot({
      title: "User Engagement Distribution",
      subtitle: "Histogram showing distribution of user visit frequencies",
      width: 700,
      height: 400,
      marginBottom: 60,
      x: {
        label: "Number of visits per user →",
        grid: true,
      },
      y: {
        label: "↑ Number of users",
        grid: true,
      },
      color: {
        scheme: "plasma",
      },
      marks: [
        Plot.rectY(
          expandedData,
          Plot.binX(
            { y: "count" },
            {
              x: (d: number) => d,
              fill: "count",
              stroke: "white",
              strokeWidth: 1,
            }
          )
        ),
        Plot.ruleY([0]),
      ],
    });

    containerRef.current.appendChild(plot);
    return () => plot.remove();
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Power-law distribution typical of user engagement patterns in social applications.</p>
      </div>
    </div>
  );
}

export function VisitTimeSeriesAnalysis({ data }: { data: RawVisitData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    // Process data for time series
    const dailyVisits = d3.rollups(
      data,
      visits => visits.length,
      d => d3.timeDay(new Date(d.created_at))
    ).map(([date, count]) => ({ date, visits: count }));

    const plot = Plot.plot({
      title: "Visit Time Series",
      subtitle: "Daily visit activity over time with trend analysis",
      width: 900,
      height: 300,
      marginBottom: 60,
      x: {
        label: "Date →",
        type: "time",
      },
      y: {
        label: "↑ Daily visits",
        grid: true,
      },
      marks: [
        // Line chart
        Plot.line(dailyVisits, {
          x: "date",
          y: "visits",
          stroke: "#ef4444",
          strokeWidth: 2,
        }),
        // Points
        Plot.dot(dailyVisits, {
          x: "date",
          y: "visits",
          fill: "#ef4444",
          r: 3,
        }),
        // Trend line
        Plot.line(dailyVisits, {
          x: "date",
          y: "visits",
          stroke: "#1f2937",
          strokeWidth: 1,
          strokeDasharray: "5,5",
          curve: "linear",
          ...Plot.linearRegressionY(),
        }),
        Plot.ruleY([0]),
      ],
    });

    containerRef.current.appendChild(plot);
    return () => plot.remove();
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Time series analysis with linear regression trend line showing growth patterns.</p>
      </div>
    </div>
  );
}

export function RestaurantRankingDotPlot({ data }: { data: RestaurantData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    // Sort and take top 15
    const topRestaurants = data
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 15);

    const plot = Plot.plot({
      title: "Restaurant Performance Ranking",
      subtitle: "Top 15 restaurants by visit count",
      width: 800,
      height: 500,
      marginLeft: 180,
      x: {
        label: "Number of visits →",
        grid: true,
      },
      y: {
        label: null,
      },
      color: {
        scheme: "turbo",
      },
      marks: [
        Plot.dot(topRestaurants, {
          x: "visits",
          y: "name",
          r: 8,
          fill: "visits",
          stroke: "white",
          strokeWidth: 2,
        }),
        Plot.text(topRestaurants, {
          x: "visits",
          y: "name",
          text: "visits",
          dx: 20,
          fontSize: 12,
          fill: "#374151",
        }),
        Plot.ruleX([0]),
      ],
    });

    containerRef.current.appendChild(plot);
    return () => plot.remove();
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div ref={containerRef} className="w-full overflow-x-auto" />
      <div className="mt-4 text-sm text-gray-600">
        <p>Cleveland dot plot showing restaurant performance with quantitative precision.</p>
      </div>
    </div>
  );
}