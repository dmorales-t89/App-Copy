'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2Icon } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const timeoutId = setTimeout(() => {
        console.warn('Auth callback timeout - redirecting to login');
        router.push('/login?error=Authentication timeout');
      }, 10000); // 10s timeout

      try {
        if (!supabase) {
          throw new Error('Configuration error');
        }

        // Handle the OAuth callback with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        clearTimeout(timeoutId);

        if (error) throw error;

        if (data.session) {
          // Use replace instead of push for faster navigation
          router.replace('/');
        } else {
          router.replace('/login?error=No session found');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        router.replace(`/login?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#011936] flex items-center justify-center">
      <div className="text-center">
        <Loader2Icon className="w-8 h-8 animate-spin text-[#C2EABD] mx-auto mb-4" />
        <p className="text-[#C2EABD]">Completing authentication...</p>
      </div>
    </div>
  );
}