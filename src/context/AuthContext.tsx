'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
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
  
  // Add ref to prevent redundant initialization calls
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isConfigured || !supabase) {
      console.warn('Supabase not configured - skipping auth initialization');
      setLoading(false);
      return;
    }

    // Prevent redundant initialization calls
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // Get initial session with timeout and rate limit handling
    const getInitialSession = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 10000) // Increased timeout
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) {
          // Handle rate limit errors gracefully
          if (error.message?.includes('rate limit') || error.status === 429) {
            console.warn('Rate limit encountered, will retry authentication later');
            setError('Authentication service is busy. Please wait a moment and try again.');
            // Set a longer timeout before retrying
            setTimeout(() => {
              setError(null);
              hasInitialized.current = false; // Allow retry
            }, 30000); // 30 second delay
          } else {
            console.error('Error getting session:', error);
            setError(`Authentication error: ${error.message}`);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (err instanceof Error && err.message.includes('timeout')) {
          setError('Authentication service is slow to respond. Please try refreshing the page.');
        } else {
          setError('Authentication service encountered an error. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling and rate limit protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);

          // Handle successful authentication
          if (event === 'SIGNED_IN' && session) {
            // Clear URL parameters after OAuth callback
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              if (url.hash || url.searchParams.has('access_token') || url.searchParams.has('code')) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
            
            // Small delay to ensure state is updated before redirect
            setTimeout(() => {
              router.replace('/calendar');
            }, 100);
          }

          if (event === 'SIGNED_OUT') {
            router.replace('/login');
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          // Don't set error state for auth state changes to prevent UI disruption
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isConfigured]);

  const signInWithGoogle = useCallback(async (): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);

      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      
      // Handle rate limit errors
      if (result.error?.status === 429 || result.error?.message?.includes('rate limit')) {
        setError('Too many authentication attempts. Please wait a moment and try again.');
        return { error: result.error };
      }
      
      return { error: result.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);
  
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);

      const result = await supabase.auth.signInWithPassword({ email, password });
      
      // Handle rate limit errors
      if (result.error?.status === 429 || result.error?.message?.includes('rate limit')) {
        setError('Too many authentication attempts. Please wait a moment and try again.');
        return { error: result.error };
      }
      
      return { error: result.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

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
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        }
      });

      if (error) {
        // Handle rate limit errors
        if (error.status === 429 || error.message?.includes('rate limit')) {
          setError('Too many authentication attempts. Please wait a moment and try again.');
        } else {
          console.error('Email sign-up error:', error);
          setError(error.message);
        }
      }

      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
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
        // Handle rate limit errors
        if (error.status === 429 || error.message?.includes('rate limit')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          console.error('Sign-out error:', error);
          setError(error.message);
        }
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