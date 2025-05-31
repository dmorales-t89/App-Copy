'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#011936]/95 backdrop-blur-md border-b border-[#C2EABD]/20"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white">
            PicScheduler
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/upload" className="text-[#C2EABD] hover:text-white transition-colors">
              Upload
            </Link>
            <Link href="/calendar" className="text-[#C2EABD] hover:text-white transition-colors">
              Calendar
            </Link>
            <Link href="/pricing" className="text-[#C2EABD] hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-[#C2EABD] hover:bg-[#C2EABD]/10">
              Log in
            </Button>
            <Button className="bg-[#C2EABD] hover:bg-[#A3D5FF] text-[#011936] font-medium">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
} 