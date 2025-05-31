'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CalendarIcon, ImageIcon, HomeIcon, GearIcon } from '@radix-ui/react-icons';

const menuItems = [
  { icon: HomeIcon, label: 'Dashboard', href: '/' },
  { icon: ImageIcon, label: 'Upload', href: '/upload' },
  { icon: CalendarIcon, label: 'Calendar', href: '/calendar' },
  { icon: GearIcon, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-screen bg-background fixed left-0 top-0 border-r border-accent/20 p-4"
    >
      <div className="flex flex-col h-full">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Picture Scheduler</h1>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-accent transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </motion.aside>
  );
} 