'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) throw error;
        setMessage('Check your email for the password reset link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 border-l-4 border-[#ff5436]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </div>
        
        {!isResetMode && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-white bg-[#ff5436] hover:bg-[#ff5436]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : isResetMode ? 'Send Reset Instructions' : 'Sign In'}
        </button>

        <button
          type="button"
          onClick={() => setIsResetMode(!isResetMode)}
          className="w-full text-sm text-gray-600 hover:text-coral-600 transition-colors"
        >
          {isResetMode ? 'Back to login' : 'Forgot your password?'}
        </button>

        {message && (
          <p className="mt-2 text-sm text-center text-coral-600 animate-fade-in">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
