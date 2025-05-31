'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageIcon, CalendarIcon } from '@radix-ui/react-icons';
import Header from '@/components/header';
import DemoSection from '@/components/sections/demo-section';
import FeaturesSection from '@/components/sections/features-section';
import FAQSection from '@/components/sections/faq-section';
import { AnimatedGridPattern } from '@/components/ui/animated-grid';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#011936] relative overflow-hidden">
      <AnimatedGridPattern className="opacity-30" />
      <div className="relative">
        <Header />
        
        {/* Hero Section */}
        <section className="px-4 pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#C2EABD] via-[#A3D5FF] to-[#C2EABD] bg-clip-text text-transparent">
                Schedule Smarter with AI
              </h1>
              <p className="text-lg md:text-xl text-[#C2EABD]/90 mb-8 max-w-2xl mx-auto">
                Transform your photos and screenshots into calendar events instantly. 
                Let AI handle the scheduling while you focus on what matters.
              </p>
              <div className="flex gap-4 justify-center">
                <Button className="bg-[#C2EABD] hover:bg-[#A3D5FF] text-[#011936] px-8 py-6 text-lg font-medium">
                  Get Started
                </Button>
                <Button variant="outline" className="border-[#C2EABD] text-[#C2EABD] hover:bg-[#C2EABD]/10 px-8 py-6 text-lg">
                  View Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <FeaturesSection />

        {/* Demo Section */}
        <DemoSection />

        {/* FAQ Section */}
        <FAQSection />
      </div>
    </div>
  );
}
