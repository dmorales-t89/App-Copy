'use client';

import { motion } from 'framer-motion';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { processCalendarImage } from '@/lib/imageProcessing';
import { useState } from 'react';
import { CalendarIcon, ImageIcon, Loader2Icon } from 'lucide-react';

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
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent"
          >
            Transform Your Calendar Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-foreground/80 mb-8"
          >
            Extract events from images instantly with our AI-powered scheduler
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-4"
          >
            <div className="p-3 bg-primary/20 w-fit rounded-lg">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Smart Image Recognition</h2>
            <p className="text-foreground/70">
              Upload any image containing calendar information and let our AI extract the events automatically.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-4"
          >
            <div className="p-3 bg-secondary/20 w-fit rounded-lg">
              <CalendarIcon className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold">Instant Calendar Integration</h2>
            <p className="text-foreground/70">
              Seamlessly sync extracted events with your favorite calendar applications.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Try It Now</h2>
            <p className="text-foreground/70">
              Upload an image and see how our AI extracts calendar events in seconds
            </p>
          </motion.div>

          <div className="bg-background rounded-xl p-6 shadow-lg">
            <FileUpload onChange={handleFileUpload} />
            
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 mt-4 text-primary">
                <Loader2Icon className="w-5 h-5 animate-spin" />
                <span>Processing image...</span>
              </div>
            )}

            {extractedEvents.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Extracted Events</h3>
                {extractedEvents.map((event, index) => (
                  <Card key={index} className="p-4">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-foreground/70">
                      {event.date.toLocaleDateString()} {event.time}
                    </p>
                    {event.description && (
                      <p className="text-sm text-foreground/70 mt-2">{event.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What types of images can I upload?</h3>
              <p className="text-foreground/70">
                You can upload any image containing calendar information, including screenshots, photos of printed calendars, or digital event invitations.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">How accurate is the event extraction?</h3>
              <p className="text-foreground/70">
                Our AI model is trained on millions of calendar formats and achieves over 95% accuracy in extracting event details from clear images.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">Which calendar apps are supported?</h3>
              <p className="text-foreground/70">
                We support integration with major calendar applications including Google Calendar, Apple Calendar, and Microsoft Outlook.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}