import { createClient } from '@supabase/supabase-js';

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

// Only create client if we have valid credentials
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_project_url_here' && 
    supabaseAnonKey !== 'your_supabase_anon_key_here') {
  
  try {
    // Validate URL format
    new URL(supabaseUrl);
    
    // Create Supabase client with optimized settings
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'picschedule-auth',
        // Set proper redirect URL for OAuth
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
      },
      global: {
        headers: {
          'X-Client-Info': 'picschedule-web'
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

// Export a safe client that handles missing configuration
export { supabase };

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Helper function to check connection with timeout
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
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );

    const connectionPromise = supabase.auth.getSession();
    
    const { data, error } = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (error) {
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

export default supabase;