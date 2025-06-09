'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGetStarted = () => {
    router.push('/signup');
  };

  const handleSignIn = () => {
    router.push('/login');
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
            <Link href="#features" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-[#C2EABD]/80 hover:text-[#C2EABD] transition-colors">
              About
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {loading ? (
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
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleGetStarted}
                  className="bg-[#C2EABD] text-[#011936] hover:bg-[#A3D5FF]"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}