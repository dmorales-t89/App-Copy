'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Prefetch routes for faster navigation
  useEffect(() => {
    router.prefetch('/signup');
    router.prefetch('/login');
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleGetStarted = () => {
    setIsNavigating(true);
    router.replace('/signup');
  };

  const handleSignIn = () => {
    setIsNavigating(true);
    router.replace('/login');
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#011936]/95 backdrop-blur-md border-b border-[#C2EABD]/20"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-[#C2EABD]">
            PicSchedule
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link href="/calendar" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
                  Calendar
                </Link>
                <Link href="/try" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
                  Try It
                </Link>
              </>
            ) : (
              <>
                <Link href="#features" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
                  Pricing
                </Link>
                <Link href="#about" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
                  About
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {loading || isNavigating ? (
              <Loader2Icon className="w-5 h-5 animate-spin text-[#C2EABD]" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-[#C2EABD]/80 text-sm">
                  Welcome, {user.email?.split('@')[0]}
                </span>
                <Button 
                  onClick={handleSignOut}
                  variant="ghost" 
                  className="text-[#C2EABD] hover:bg-[#C2EABD]/10"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleSignIn}
                  variant="ghost" 
                  className="text-[#C2EABD] hover:bg-[#C2EABD]/10"
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                  ) : 'Sign In'}
                </Button>
                <Button 
                  onClick={handleGetStarted}
                  className="bg-[#C2EABD] text-[#011936] hover:bg-[#A3D5FF]"
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <>
                      <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : 'Get Started'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}