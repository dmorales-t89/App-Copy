'use client';

import { useEffect } from 'react';
import { Loader2Icon } from 'lucide-react';

export default function AuthCallback() {
  useEffect(() => {
    // The AuthContext will automatically handle session parsing from URL hash
    // and perform the appropriate redirect, so we don't need to do anything here
    // except show a loading state while the AuthContext processes the callback
  }, []);

  return (
    <div className="min-h-screen bg-[#011936] flex items-center justify-center">
      <div className="text-center">
        <Loader2Icon className="w-8 h-8 animate-spin text-[#C2EABD] mx-auto mb-4" />
        <p className="text-[#C2EABD]">Completing authentication...</p>
      </div>
    </div>
  );
}