'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  // Check for error parameter in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=access_denied')) {
      setMessage('Password reset link has expired. Please request a new one.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isResetMode) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password?type=recovery`
        });
        
        if (error) {
          setMessage(error.message);
        } else {
          setMessage('Password reset instructions have been sent to your email!');
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.');
        console.error('Reset password error:', error);
      }
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If login fails, try to sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setMessage(signUpError.message);
        } else if (signUpData.user) {
          setMessage('Please check your email to confirm your signup!');
        }
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      console.error('Auth error:', error);
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsResetMode(!isResetMode);
    setMessage('');
    setPassword('');
    // Clear the error from URL without refreshing
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <div className="card p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </div>
        {!isResetMode && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required={!isResetMode}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            isResetMode ? 'Send Reset Instructions' : 'Log in or Sign up'
          )}
        </button>
        <button
          type="button"
          onClick={toggleMode}
          className="w-full text-sm text-gray-600 hover:text-purple-600 transition-colors"
        >
          {isResetMode ? 'Back to login' : 'Forgot your password?'}
        </button>
        {message && (
          <p className="mt-2 text-sm text-center text-coral-600 animate-fade-in">{message}</p>
        )}
      </form>
    </div>
  );
} 