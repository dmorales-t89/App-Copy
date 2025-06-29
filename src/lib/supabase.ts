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

// Singleton instance for client-side usage
let clientInstance: any = null;

// Create singleton client component client
function getSupabaseClient() {
  if (clientInstance) {
    return clientInstance;
  }

  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here') {
    
    try {
      // Validate URL format
      new URL(supabaseUrl);
      
      // Create single instance using createClientComponentClient for Next.js
      clientInstance = createClientComponentClient({
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
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

  return clientInstance;
}

// Server-side client (for API routes)
let serverInstance: any = null;

function getSupabaseServerClient() {
  if (serverInstance) {
    return serverInstance;
  }

  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url_here' && 
      supabaseAnonKey !== 'your_supabase_anon_key_here') {
    
    try {
      // Validate URL format
      new URL(supabaseUrl);
      
      // Create server instance with optimized settings
      serverInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false, // Disable auto-refresh on server
          persistSession: false,   // Don't persist sessions on server
          detectSessionInUrl: false
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

  return serverInstance;
}

// Export the singleton client getter
export const supabase = getSupabaseClient();

// Export server client for API routes
export const supabaseServer = getSupabaseServerClient();

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