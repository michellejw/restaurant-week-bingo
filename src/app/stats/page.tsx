import { Suspense } from 'react';
import StatsContent from './StatsContent';

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-coral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-coral-900 mb-2">
              Restaurant Week Data Analytics
            </h1>
            <p className="text-coral-700">
              Statistical analysis of user engagement patterns and temporal behavior
            </p>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-coral-500"></div>
            </div>
          }>
            <StatsContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}