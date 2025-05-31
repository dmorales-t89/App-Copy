'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Header() {
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
            PicScheduler
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
            <Button variant="ghost" className="text-[#C2EABD] hover:bg-[#C2EABD]/10">
              Sign In
            </Button>
            <Button className="bg-[#C2EABD] text-[#011936] hover:bg-[#A3D5FF]">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
} 