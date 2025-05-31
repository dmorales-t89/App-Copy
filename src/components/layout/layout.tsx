'use client';

import { motion } from 'framer-motion';
import { Sidebar } from './sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-white">
      <Sidebar />
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ml-64 p-8"
      >
        {children}
      </motion.main>
    </div>
  );
} 