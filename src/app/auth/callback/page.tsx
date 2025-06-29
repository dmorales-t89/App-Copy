'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Clear any authentication-related URL parameters and redirect
        // The AuthContext will automatically handle session parsing from URL hash
        router.replace('/');
      } catch (err) {
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