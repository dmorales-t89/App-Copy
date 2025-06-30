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

// Helper function to clear all Supabase auth data from localStorage
const clearSupabaseAuthData = () => {
  if (typeof window !== 'undefined') {
    // Clear all possible Supabase auth keys
    const keysToRemove = [
      'supabase.auth.token',
      'sb-zjtxdbsphjlisenaanmu-auth-token',
      'sb-auth-token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any keys that start with 'sb-' (Supabase convention)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  }
};

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  const router = useRouter();
  
  // Add ref to prevent redundant initialization calls
  const hasInitialized = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          setTimeout(() => reject(new Error('Session timeout')), 20000) // Increased timeout to 20 seconds
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Session error:', error);
          
          // Handle rate limit errors gracefully
          if (error.message?.includes('rate limit') || error.status === 429) {
            console.warn('Rate limit encountered, clearing auth data and retrying later');
            clearSupabaseAuthData();
            setError('Authentication service is busy. Please wait a moment and try again.');
            setUser(null);
            setSession(null);
            
            // Clear any existing retry timeout
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            
            // Set a longer timeout before retrying
            retryTimeoutRef.current = setTimeout(() => {
              setError(null);
              hasInitialized.current = false; // Allow retry
              retryTimeoutRef.current = null;
            }, 60000); // 60 second delay for rate limits
          } 
          // Handle invalid refresh token errors
          else if (error.status === 400 && (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token'))) {
            console.warn('Invalid refresh token detected, clearing all auth data');
            clearSupabaseAuthData();
            setUser(null);
            setSession(null);
            setError('Your session has expired. Please sign in again.');
            
            // Redirect to login after a short delay
            setTimeout(() => {
              setError(null);
              router.push('/login');
            }, 2000);
          }
          else {
            console.error('Error getting session:', error);
            setError(`Authentication error: ${error.message}`);
            // For other errors, also clear auth data to prevent repeated failures
            clearSupabaseAuthData();
            setUser(null);
            setSession(null);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
          
          // If we have a valid session and we're on the login page, redirect to calendar
          if (session?.user && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/signup') {
              console.log('Valid session found on auth page, redirecting to calendar...');
              router.push('/calendar');
            }
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        clearSupabaseAuthData();
        setUser(null);
        setSession(null);
        
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
          console.log('Auth state change:', event, 'Session:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);

          // Handle successful authentication
          if (event === 'SIGNED_IN' && session) {
            console.log('User signed in successfully, redirecting to calendar...');
            
            // Clear URL parameters after OAuth callback
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              if (url.hash || url.searchParams.has('access_token') || url.searchParams.has('code')) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
            
            // Force redirect to calendar with a small delay to ensure state is updated
            setTimeout(() => {
              router.push('/calendar');
            }, 100);
          }

          if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing auth data and redirecting to home...');
            clearSupabaseAuthData();
            router.replace('/');
          }

          // Handle token refresh errors
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('Token refresh failed, clearing session and auth data');
            clearSupabaseAuthData();
            setUser(null);
            setSession(null);
            setError('Your session has expired. Please sign in again.');
            router.push('/login');
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          // Don't set error state for auth state changes to prevent UI disruption
        }
      }
    );

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
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
        clearSupabaseAuthData();
        setError('Too many authentication attempts. Please wait a moment and try again.');
        return { error: result.error };
      }
      
      return { error: result.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      clearSupabaseAuthData();
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

      console.log('Attempting email sign in for:', email);
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      // Handle rate limit errors
      if (result.error?.status === 429 || result.error?.message?.includes('rate limit')) {
        clearSupabaseAuthData();
        setError('Too many authentication attempts. Please wait a moment and try again.');
        return { error: result.error };
      }
      
      if (result.error) {
        console.error('Sign in error:', result.error);
        setError(result.error.message);
        // Clear auth data on sign-in errors to prevent repeated failures
        if (result.error.status === 400) {
          clearSupabaseAuthData();
        }
        return { error: result.error };
      }

      if (result.data?.user && result.data?.session) {
        console.log('Sign in successful for user:', result.data.user.email);
        console.log('Session created:', !!result.data.session);
        
        // Update state immediately
        setUser(result.data.user);
        setSession(result.data.session);
        
        // The auth state change listener will also handle the redirect,
        // but we can also redirect here as a backup
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname !== '/calendar') {
            console.log('Redirecting to calendar after successful sign in...');
            router.push('/calendar');
          }
        }, 500);
      }
      
      return { error: result.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Sign in exception:', err);
      setError(errorMessage);
      clearSupabaseAuthData();
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, [router]);

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
          clearSupabaseAuthData();
          setError('Too many authentication attempts. Please wait a moment and try again.');
        } else {
          console.error('Email sign-up error:', error);
          setError(error.message);
          // Clear auth data on sign-up errors to prevent repeated failures
          if (error.status === 400) {
            clearSupabaseAuthData();
          }
        }
      }

      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      clearSupabaseAuthData();
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
      
      // Always clear auth data on sign out, regardless of success/failure
      clearSupabaseAuthData();
      
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
      clearSupabaseAuthData();
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