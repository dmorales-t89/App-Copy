'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ImageIcon, Settings2Icon } from 'lucide-react';

const menuItems = [
  { icon: ImageIcon, label: 'Upload', href: '/upload' },
  { icon: CalendarIcon, label: 'Calendar', href: '/calendar' },
  { icon: Settings2Icon, label: 'Settings', href: '/settings' },
];

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-accent/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-primary">
              Picture Scheduler
            </Link>
            
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <Link
                href="/pricing"
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-sm">
              Log in
            </Button>
            <Button className="text-sm bg-primary hover:bg-primary/90">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}