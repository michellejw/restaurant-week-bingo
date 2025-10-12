import { Suspense } from 'react';
import AdminContent from './AdminContent';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-coral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-coral-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-coral-700">
              Manage user visits and restaurant check-ins
            </p>
          </div>
          
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-coral-500"></div>
            </div>
          }>
            <AdminContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}