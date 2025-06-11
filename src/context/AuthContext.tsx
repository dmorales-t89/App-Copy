'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';

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

  // Add debounce for state updates
  const debouncedSetLoading = useCallback(
    debounce((value: boolean) => {
      setLoading(value);
    }, 100),
    []
  );

  useEffect(() => {
    if (!isConfigured || !supabase) {
      console.warn('Supabase not configured - skipping auth initialization');
      debouncedSetLoading(false);
      return;
    }

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.error('Error getting session:', error);
          setError(`Authentication error: ${error.message}`);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        setError('Authentication service is slow to respond. Please try again.');
      } finally {
        debouncedSetLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        debouncedSetLoading(false);
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
          }, 50);
        }

        if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isConfigured, debouncedSetLoading]);

  // Add debounce for sign-in operations
  const debouncedSignIn = useCallback(
    (provider: 'google' | 'email', options?: any): Promise<{ error: AuthError | null }> => {
      return new Promise((resolve) => {
        const debouncedFn = debounce(async () => {
          if (!supabase) {
            const error = { message: 'Authentication not configured' } as AuthError;
            setError(error.message);
            resolve({ error });
            return;
          }

          try {
            setError(null);
            debouncedSetLoading(true);

            if (provider === 'google') {
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
              resolve({ error: result.error });
            } else {
              const result = await supabase.auth.signInWithPassword(options);
              resolve({ error: result.error });
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            resolve({ error: { message: errorMessage } as AuthError });
          } finally {
            debouncedSetLoading(false);
          }
        }, 100);

        debouncedFn();
      });
    },
    [debouncedSetLoading]
  );

  const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
    return debouncedSignIn('google');
  };
  
  const signInWithEmail = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    return debouncedSignIn('email', { email, password });
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
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
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