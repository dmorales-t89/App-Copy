'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, resetSupabaseClient } from '@/lib/supabase';
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

// Rate limiting protection
const rateLimitTracker = {
  lastRequest: 0,
  requestCount: 0,
  resetTime: 0,
  
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset counter every minute
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000; // 1 minute
    }
    
    // Allow max 5 requests per minute
    if (this.requestCount >= 5) {
      return false;
    }
    
    // Minimum 2 seconds between requests
    if (now - this.lastRequest < 2000) {
      return false;
    }
    
    this.lastRequest = now;
    this.requestCount++;
    return true;
  },
  
  markRateLimited(): void {
    // If rate limited, wait 2 minutes before allowing requests
    this.resetTime = Date.now() + 120000;
    this.requestCount = 10; // Set high to prevent requests
  }
};

// Helper function to clear all Supabase auth data
const clearSupabaseAuthData = () => {
  resetSupabaseClient();
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
  const authSubscriptionRef = useRef<any>(null);

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

    // Get initial session with rate limiting protection
    const getInitialSession = async () => {
      try {
        // Check rate limiting before making request
        if (!rateLimitTracker.canMakeRequest()) {
          console.warn('Rate limit protection: skipping session request');
          setLoading(false);
          return;
        }

        // Shorter timeout to fail fast
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000) // Reduced to 5 seconds
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Session error:', error);
          
          // Handle rate limit errors gracefully
          if (error.message?.includes('rate limit') || error.status === 429) {
            console.warn('Rate limit encountered, marking rate limited');
            rateLimitTracker.markRateLimited();
            clearSupabaseAuthData();
            setError('Authentication service is busy. Please wait a few minutes and try again.');
            setUser(null);
            setSession(null);
          } 
          // Handle invalid refresh token errors
          else if (error.status === 400 && (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token'))) {
            console.warn('Invalid refresh token detected, clearing all auth data');
            clearSupabaseAuthData();
            setUser(null);
            setSession(null);
            setError(null); // Don't show error for expired sessions
          }
          else {
            console.error('Error getting session:', error);
            clearSupabaseAuthData();
            setUser(null);
            setSession(null);
            setError(null); // Don't show error to avoid UI disruption
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
        setError(null); // Don't show initialization errors to users
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling and rate limit protection
    if (!authSubscriptionRef.current) {
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
              setError(null); // Don't show error for token refresh failures
            }
          } catch (err) {
            console.error('Auth state change error:', err);
            // Don't set error state for auth state changes to prevent UI disruption
          }
        }
      );
      
      authSubscriptionRef.current = subscription;
    }

    // Cleanup function
    return () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
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

    // Check rate limiting
    if (!rateLimitTracker.canMakeRequest()) {
      const error = { message: 'Too many requests. Please wait a moment and try again.' } as AuthError;
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
        rateLimitTracker.markRateLimited();
        clearSupabaseAuthData();
        setError('Too many authentication attempts. Please wait a few minutes and try again.');
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

    // Check rate limiting
    if (!rateLimitTracker.canMakeRequest()) {
      const error = { message: 'Too many requests. Please wait a moment and try again.' } as AuthError;
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
        rateLimitTracker.markRateLimited();
        clearSupabaseAuthData();
        setError('Too many authentication attempts. Please wait a few minutes and try again.');
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

    // Check rate limiting
    if (!rateLimitTracker.canMakeRequest()) {
      const error = { message: 'Too many requests. Please wait a moment and try again.' } as AuthError;
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
          rateLimitTracker.markRateLimited();
          clearSupabaseAuthData();
          setError('Too many authentication attempts. Please wait a few minutes and try again.');
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