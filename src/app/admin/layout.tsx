import { redirect } from 'next/navigation';
import { getSession } from '@auth0/nextjs-auth0';
import { AdminSidebar } from '@/components/nav/admin-sidebar';

async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  // If not logged in, redirect to login
  if (!session?.user) {
    redirect('/api/auth/login');
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-100">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout; 