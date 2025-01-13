'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/nav/admin-sidebar';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: auth0User, isLoading: auth0Loading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (auth0User?.email) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('isAdmin')
            .eq('email', auth0User.email)
            .single();

          if (error) {
            console.error('Error fetching admin status:', error);
            redirect('/');
            return;
          }

          if (!data?.isAdmin) {
            redirect('/');
            return;
          }

          setIsAdmin(true);
        } catch (err) {
          console.error('Error checking admin status:', err);
          redirect('/');
        } finally {
          setIsCheckingAdmin(false);
        }
      } else if (!auth0Loading) {
        redirect('/api/auth/login');
      }
    }

    checkAdminStatus();
  }, [auth0User?.email, auth0Loading]);

  if (auth0Loading || isCheckingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!auth0User) {
    redirect('/api/auth/login');
  }

  if (!isAdmin) {
    return null; // Return null while redirecting
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