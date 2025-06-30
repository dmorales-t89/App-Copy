import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Environment variable validation with better error messages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not configured');
  console.error('Please add your Supabase project URL to .env.local');
  console.error('Example: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  console.error('Please add your Supabase anon key to .env.local');
  console.error('Example: NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
}

// Global singleton instance to prevent multiple clients
let globalClientInstance: any = null;

// Create singleton client component client
function getSupabaseClient() {
  // Return existing instance if available
  if (globalClientInstance) {
    return globalClientInstance;
  }

  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here') {
    
    try {
      // Validate URL format
      new URL(supabaseUrl);
      
      // Create single global instance with optimized settings
      globalClientInstance = createClientComponentClient({
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
        options: {
          auth: {
            // Disable automatic token refresh to prevent loops
            autoRefreshToken: false,
            // Don't persist session to prevent stale token issues
            persistSession: true,
            // Don't detect session in URL to prevent conflicts
            detectSessionInUrl: false,
            // Use PKCE flow for better security
            flowType: 'pkce'
          },
          global: {
            headers: {
              'X-Client-Info': 'picschedule-client'
            }
          }
        }
      });
      
      console.log('✅ Supabase client initialized successfully');
      console.log('🔗 Supabase URL:', supabaseUrl);
    } catch (error) {
      console.error('❌ Invalid Supabase URL format:', supabaseUrl);
      console.error('Please check your NEXT_PUBLIC_SUPABASE_URL in .env.local');
    }
  } else {
    console.warn('⚠️ Supabase not configured - authentication will not work');
    console.warn('Please configure your .env.local file with valid Supabase credentials');
  }

  return globalClientInstance;
}

// Server-side client (for API routes) - also singleton
let globalServerInstance: any = null;

function getSupabaseServerClient() {
  // Return existing instance if available
  if (globalServerInstance) {
    return globalServerInstance;
  }

  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here') {
    
    try {
      // Validate URL format
      new URL(supabaseUrl);
      
      // Create server instance with optimized settings
      globalServerInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false, // Disable auto-refresh on server
          persistSession: false,   // Don't persist sessions on server
          detectSessionInUrl: false,
          flowType: 'pkce'
        },
        global: {
          headers: {
            'X-Client-Info': 'picschedule-server'
          }
        }
      });
    } catch (error) {
      console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    }
  }

  return globalServerInstance;
}

// Export the singleton client getter
export const supabase = getSupabaseClient();

// Export server client for API routes
export const supabaseServer = getSupabaseServerClient();

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return globalClientInstance !== null;
}

// Helper function to check connection with timeout and rate limit protection
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  details?: any;
}> {
  if (!supabase) {
    return {
      connected: false,
      error: 'Supabase not configured. Please check your .env.local file.',
    };
  }

  try {
    // Add timeout to prevent hanging - reduced to 3 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 3000)
    );

    // Use a simple health check instead of getSession to avoid rate limits
    const connectionPromise = supabase.from('events').select('count', { count: 'exact', head: true });
    
    const { data, error } = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is fine for connection test
      return {
        connected: false,
        error: error.message,
        details: error
      };
    }

    return {
      connected: true
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
      details: error
    };
  }
}

// Helper function to clear all auth storage and reset client state
export function resetSupabaseClient() {
  if (typeof window !== 'undefined') {
    console.log('Clearing Supabase auth storage...');
    
    // Clear all possible Supabase auth keys
    const keysToRemove = [
      'supabase.auth.token',
      'sb-zjtxdbsphjlisenaanmu-auth-token',
      'sb-auth-token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Also clear any keys that start with 'sb-' (Supabase convention)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Don't reset the global client instance to avoid creating multiple instances
  // Just clear the auth state within the existing client
  if (globalClientInstance) {
    try {
      // Force clear the auth state without making network requests
      globalClientInstance.auth.stopAutoRefresh();
    } catch (error) {
      console.warn('Error stopping auto refresh:', error);
    }
  }
}

export default supabase;