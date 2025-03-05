'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        // Check URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (code) {
          // If we have a code, we're in the initial redirect
          // Exchange the code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code:', error);
            setMessage('Invalid or expired reset link. Please request a new one.');
            setTimeout(() => router.push('/'), 2000);
            return;
          }
        }

        // Listen for password recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth event:', event);
          if (event === 'PASSWORD_RECOVERY') {
            // We're in a valid password recovery flow
            setMessage('');
          } else if (!session) {
            // If we don't have a session and we're not in recovery, redirect
            router.push('/');
          }
        });

        // Check current session state
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setMessage('Invalid or expired reset link. Please request a new one.');
          setTimeout(() => router.push('/'), 2000);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Initialization error:', error);
        setMessage('Error initializing password reset. Please try again.');
        setTimeout(() => router.push('/'), 2000);
      }
    };

    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      setMessage('Password updated successfully! Redirecting to login...');
      
      // Sign out after successful password change
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      setMessage(errorMessage);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Reset Your Password
        </h1>
        <div className="card p-8 border-l-4 border-[#ff5436]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                required
                minLength={6}
                placeholder="Enter your new password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
                minLength={6}
                placeholder="Confirm your new password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-[#ff5436] hover:bg-[#ff5436]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
            {message && (
              <p className="mt-2 text-sm text-center text-coral-600 animate-fade-in">
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
} 