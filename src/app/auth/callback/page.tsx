'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2Icon } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          console.error('Supabase not configured');
          router.push('/login?error=Configuration error');
          return;
        }

        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (data.session) {
          console.log('Authentication successful, redirecting...');
          router.push('/');
        } else {
          console.log('No session found, redirecting to login...');
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        router.push('/login?error=Authentication failed');
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