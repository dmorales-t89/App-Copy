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

// Enhanced rate limiting with exponential backoff
const rateLimitTracker = {
  lastRequest: 0,
  requestCount: 0,
  resetTime: 0,
  backoffUntil: 0,
  
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check if we're in backoff period
    if (now < this.backoffUntil) {
      console.log('In backoff period, blocking request');
      return false;
    }
    
    // Reset counter every minute
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000; // 1 minute
    }
    
    // Allow max 3 requests per minute (reduced from 5)
    if (this.requestCount >= 3) {
      console.log('Rate limit reached, blocking request');
      return false;
    }
    
    // Minimum 3 seconds between requests (increased from 2)
    if (now - this.lastRequest < 3000) {
      console.log('Too soon since last request, blocking');
      return false;
    }
    
    this.lastRequest = now;
    this.requestCount++;
    return true;
  },
  
  markRateLimited(): void {
    // Exponential backoff: start with 5 minutes, double each time
    const backoffDuration = Math.min(300000 * Math.pow(2, this.requestCount), 1800000); // Max 30 minutes
    this.backoffUntil = Date.now() + backoffDuration;
    this.resetTime = this.backoffUntil + 60000; // Reset counter after backoff
    this.requestCount = 10; // Set high to prevent requests
    console.log(`Rate limited, backing off for ${backoffDuration / 1000} seconds`);
  }
};

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  const router = useRouter();
  
  // Prevent multiple initialization attempts
  const hasInitialized = useRef(false);
  const authSubscriptionRef = useRef<any>(null);
  const initializationAttempts = useRef(0);
  const maxInitAttempts = 2; // Limit initialization attempts

  // Clear auth data helper
  const clearAuthData = useCallback(() => {
    console.log('Clearing all auth data');
    resetSupabaseClient();
    setUser(null);
    setSession(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!isConfigured || !supabase) {
      console.warn('Supabase not configured - skipping auth initialization');
      setLoading(false);
      return;
    }

    // Prevent redundant initialization calls
    if (hasInitialized.current) {
      console.log('Auth already initialized, skipping');
      return;
    }

    // Limit initialization attempts
    if (initializationAttempts.current >= maxInitAttempts) {
      console.warn('Max initialization attempts reached, giving up');
      setLoading(false);
      return;
    }

    hasInitialized.current = true;
    initializationAttempts.current++;

    console.log(`Auth initialization attempt ${initializationAttempts.current}/${maxInitAttempts}`);

    // Get initial session with strict rate limiting
    const getInitialSession = async () => {
      try {
        // Check rate limiting before making request
        if (!rateLimitTracker.canMakeRequest()) {
          console.warn('Rate limit protection: skipping session request');
          setLoading(false);
          return;
        }

        console.log('Getting initial session...');
        
        // Very short timeout to fail fast
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000) // Reduced to 3 seconds
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('Session error:', error);
          
          // Handle rate limit errors
          if (error.message?.includes('rate limit') || error.status === 429) {
            console.warn('Rate limit encountered during initialization');
            rateLimitTracker.markRateLimited();
            clearAuthData();
            setError('Authentication service is busy. Please wait and try again later.');
          } 
          // Handle invalid refresh token errors
          else if (error.status === 400 && (
            error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('refresh_token_not_found')
          )) {
            console.warn('Invalid refresh token detected, clearing auth data');
            clearAuthData();
            // Don't show error for expired sessions
          }
          else {
            console.error('Other session error:', error);
            clearAuthData();
            // Don't show error to avoid UI disruption
          }
        } else {
          console.log('Session retrieved successfully:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
          
          // If we have a valid session and we're on an auth page, redirect
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
        clearAuthData();
        
        // If it's a timeout, don't show error to user
        if (err instanceof Error && err.message.includes('timeout')) {
          console.warn('Session initialization timed out');
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener (only once)
    if (!authSubscriptionRef.current) {
      console.log('Setting up auth state listener...');
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          try {
            console.log('Auth state change:', event, 'Has session:', !!session);
            
            // Update state
            setSession(session);
            setUser(session?.user ?? null);
            setError(null);

            // Handle successful authentication
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('User signed in successfully:', session.user.email);
              setLoading(false);
              
              // Clear URL parameters after OAuth callback
              if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                if (url.hash || url.searchParams.has('access_token') || url.searchParams.has('code')) {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }
                
                // Redirect to calendar if not already there
                const currentPath = window.location.pathname;
                if (currentPath !== '/calendar') {
                  console.log('Redirecting to calendar after sign in...');
                  router.push('/calendar');
                }
              }
            }

            if (event === 'SIGNED_OUT') {
              console.log('User signed out, clearing data and redirecting...');
              clearAuthData();
              setLoading(false);
              router.replace('/');
            }

            // Handle token refresh failures
            if (event === 'TOKEN_REFRESHED' && !session) {
              console.warn('Token refresh failed, clearing session');
              clearAuthData();
              setLoading(false);
            }

            // Handle auth errors
            if (event === 'USER_UPDATED' && !session) {
              console.warn('User update without session, clearing auth data');
              clearAuthData();
              setLoading(false);
            }

          } catch (err) {
            console.error('Auth state change error:', err);
            setLoading(false);
          }
        }
      );
      
      authSubscriptionRef.current = subscription;
    }

    // Cleanup function
    return () => {
      if (authSubscriptionRef.current) {
        console.log('Cleaning up auth subscription');
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, [router, isConfigured, clearAuthData]);

  const signInWithGoogle = useCallback(async (): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    // Check rate limiting
    if (!rateLimitTracker.canMakeRequest()) {
      const error = { message: 'Too many requests. Please wait a few minutes and try again.' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);

      console.log('Starting Google sign in...');
      
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
        console.error('Google sign in rate limited');
        rateLimitTracker.markRateLimited();
        clearAuthData();
        setError('Too many authentication attempts. Please wait a few minutes and try again.');
        return { error: result.error };
      }
      
      if (result.error) {
        console.error('Google sign in error:', result.error);
        setError(result.error.message);
      }
      
      return { error: result.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Google sign in exception:', err);
      setError(errorMessage);
      clearAuthData();
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, [clearAuthData]);
  
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    // Check rate limiting
    if (!rateLimitTracker.canMakeRequest()) {
      const error = { message: 'Too many requests. Please wait a few minutes and try again.' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);

      console.log('Attempting email sign in for:', email);
      
      const result = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      // Handle rate limit errors
      if (result.error?.status === 429 || result.error?.message?.includes('rate limit')) {
        console.error('Email sign in rate limited');
        rateLimitTracker.markRateLimited();
        clearAuthData();
        setError('Too many authentication attempts. Please wait a few minutes and try again.');
        return { error: result.error };
      }
      
      if (result.error) {
        console.error('Email sign in error:', result.error);
        setError(result.error.message);
        
        // Clear auth data on certain errors to prevent repeated failures
        if (result.error.status === 400 || result.error.message?.includes('Invalid')) {
          clearAuthData();
        }
        return { error: result.error };
      }

      if (result.data?.user && result.data?.session) {
        console.log('Email sign in successful for:', result.data.user.email);
        
        // Update state immediately
        setUser(result.data.user);
        setSession(result.data.session);
        setError(null);
        
        // The auth state change listener will handle the redirect,
        // but we can also redirect here as a backup
        console.log('Sign in successful, auth state listener should handle redirect');
      }
      
      return { error: result.error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Email sign in exception:', err);
      setError(errorMessage);
      clearAuthData();
      return { error: { message: errorMessage } as AuthError };
    } finally {
      setLoading(false);
    }
  }, [clearAuthData]);

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      const error = { message: 'Authentication not configured' } as AuthError;
      setError(error.message);
      return { error };
    }

    // Check rate limiting
    if (!rateLimitTracker.canMakeRequest()) {
      const error = { message: 'Too many requests. Please wait a few minutes and try again.' } as AuthError;
      setError(error.message);
      return { error };
    }

    try {
      setError(null);
      setLoading(true);

      console.log('Attempting email sign up for:', email);

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        }
      });

      if (error) {
        // Handle rate limit errors
        if (error.status === 429 || error.message?.includes('rate limit')) {
          console.error('Email sign up rate limited');
          rateLimitTracker.markRateLimited();
          clearAuthData();
          setError('Too many authentication attempts. Please wait a few minutes and try again.');
        } else {
          console.error('Email sign-up error:', error);
          setError(error.message);
          
          // Clear auth data on certain errors
          if (error.status === 400) {
            clearAuthData();
          }
        }
      } else {
        console.log('Sign up successful, check email for confirmation');
      }

      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Email sign up exception:', err);
      setError(errorMessage);
      clearAuthData();
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
      console.log('Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      // Always clear auth data on sign out, regardless of success/failure
      clearAuthData();
      
      if (error) {
        console.error('Sign-out error:', error);
        // Don't show sign out errors to user since we cleared the data anyway
      } else {
        console.log('Sign out successful');
      }

      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Sign out exception:', err);
      clearAuthData();
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