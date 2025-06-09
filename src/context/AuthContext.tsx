'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  error: string | null;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  const router = useRouter();

  useEffect(() => {
    if (!isConfigured || !supabase) {
      console.warn('Supabase not configured - skipping auth initialization');
      setLoading(false);
      return;
    }

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.error('Error getting session:', error);
          setError(`Authentication error: ${error.message}`);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          console.log('Initial session loaded:', session?.user?.email || 'No user');
        }
      } catch (err) {
        console.error('Session initialization timeout:', err);
        setError('Authentication service is slow to respond. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null);

        // Handle successful authentication
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in successfully');
          
          // Clear URL parameters after OAuth callback
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (url.hash || url.searchParams.has('access_token') || url.searchParams.has('code')) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
          
          // Small delay to ensure state is updated before redirect
          setTimeout(() => {
            router.push('/');
          }, 100);
        }

        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          // Don't auto-redirect on sign out to avoid loops
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isConfigured]);

  const signInWithGoogle = async () => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('Initiating Google sign-in...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Changed from 'consent' to allow faster re-auth
          }
        }
      });

      if (error) {
        console.error('Google sign-in error:', error);
        setError(`Google sign-in failed: ${error.message}`);
        setLoading(false);
      }

      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Google sign-in exception:', err);
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } as AuthError };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Email sign-in error:', error);
        setError(error.message);
      }

      setLoading(false);
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } as AuthError };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        }
      });

      if (error) {
        console.error('Email sign-up error:', error);
        setError(error.message);
      }

      setLoading(false);
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } as AuthError };
    }
  };

  const signOut = async () => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign-out error:', error);
        setError(error.message);
      }

      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    error,
    isConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}