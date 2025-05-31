'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { ImageIcon, CalendarIcon } from '@radix-ui/react-icons';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import Header from '@/components/header';
import { processCalendarImage } from '@/lib/imageProcessing';
import { AnimatedGridPattern } from '@/components/ui/animated-grid';

interface ExtractedEvent {
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length > 0) {
      setIsProcessing(true);
      try {
        const events = await processCalendarImage(files[0]);
        setExtractedEvents(events);
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

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
                  Try Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4 text-[#C2EABD]">Try It Now</h2>
              <p className="text-[#C2EABD]/80">
                Upload an image and see how our AI extracts calendar events in seconds
              </p>
            </motion.div>

            <Card className="p-8 bg-white/10 backdrop-blur-sm border border-[#C2EABD]/20">
              <FileUpload onChange={handleFileUpload} />
              
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 mt-4 text-[#C2EABD]">
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                  <span>Processing image...</span>
                </div>
              )}

              {extractedEvents.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-semibold mb-4 text-[#C2EABD]">Extracted Events</h3>
                  {extractedEvents.map((event, index) => (
                    <Card key={index} className="p-4 bg-white/5 border border-[#C2EABD]/20">
                      <h4 className="font-medium text-[#C2EABD]">{event.title}</h4>
                      <p className="text-sm text-[#C2EABD]/80">
                        {event.date.toLocaleDateString()} {event.time}
                      </p>
                      {event.description && (
                        <p className="text-sm text-[#C2EABD]/80 mt-2">{event.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}