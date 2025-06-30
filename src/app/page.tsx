'use client';

import { motion, useSpring, type SpringOptions } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { ImageIcon, CalendarIcon, ClockIcon, CheckCircledIcon, CursorArrowIcon } from '@radix-ui/react-icons';
import { Loader2Icon, Clock, MapPin, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Header from '@/components/header';
import { processCalendarImage } from '@/lib/imageProcessing';
import { AnimatedGridPattern } from '@/components/ui/animated-grid';
import { AnimatedCalendar } from '@/components/ui/animated-calendar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BoltBadge } from '@/components/BoltBadge';

interface ExtractedEvent {
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  description?: string;
}

const springConfig: SpringOptions = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const uploadRef = useRef<HTMLDivElement>(null);
  const demoSectionRef = useRef<HTMLDivElement>(null);
  const uploadRotateX = useSpring(0, springConfig);
  const uploadRotateY = useSpring(0, springConfig);
  const uploadScale = useSpring(1, springConfig);

  useEffect(() => {
    if (user) {
      router.push('/calendar');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const scrollToDemo = () => {
    demoSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleGetStarted = () => {
    setIsNavigating(true);
    router.push('/signup');
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length > 0) {
      setIsProcessing(true);
      setExtractedEvents([]); // Clear previous events
      
      try {
        console.log('Processing image...');
        const events = await processCalendarImage(files[0]);
        console.log('Extracted events:', events);
        setExtractedEvents(events);
      } catch (error) {
        console.error('Error processing image:', error);
        // Show error in UI if needed
        alert('Error processing image: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  function handleUploadMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!uploadRef.current) return;
    const rect = uploadRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateYValue = ((e.clientX - centerX) / (rect.width / 2)) * 14;
    const rotateXValue = ((e.clientY - centerY) / (rect.height / 2)) * -14;
    uploadRotateX.set(rotateXValue);
    uploadRotateY.set(rotateYValue);
  }

  // Helper function to format time for display
  const formatTimeForDisplay = (time?: string) => {
    if (!time) return null;
    
    try {
      // If it's already in 12-hour format, return as is
      if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
        return time;
      }
      
      // Convert 24-hour format to 12-hour format
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return time; // Return original if parsing fails
    }
  };

  return (
    <div className="min-h-screen bg-[#011936] relative overflow-hidden">
      <AnimatedGridPattern className="opacity-30" />
      
      {/* Bolt Badge - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <BoltBadge variant="white-circle" size={40} />
      </div>
      
      <div className="relative">
        <Header />
        
        {/* Hero Section */}
        <section className="px-4 pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center md:text-left"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#C2EABD] via-[#A3D5FF] to-[#C2EABD] bg-clip-text text-transparent">
                  Schedule Smarter with AI
                </h1>
                <p className="text-lg md:text-xl text-[#C2EABD]/90 mb-8 max-w-2xl">
                  Transform your photos and screenshots into calendar events instantly. 
                  Let AI handle the scheduling while you focus on what matters.
                </p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <Button 
                    onClick={handleGetStarted}
                    disabled={isNavigating}
                    className="bg-[#C2EABD] hover:bg-[#A3D5FF] text-[#011936] px-8 py-6 text-lg font-medium disabled:opacity-50"
                  >
                    {isNavigating ? (
                      <>
                        <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-[#C2EABD] text-[#C2EABD] hover:bg-[#C2EABD]/10 px-8 py-6 text-lg"
                    onClick={scrollToDemo}
                  >
                    Try Demo
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center"
              >
                <AnimatedCalendar />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white/95 backdrop-blur-md relative">
          <div className="container mx-auto max-w-6xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#011936]">
                Why Choose PicSchedule?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience the future of calendar management with our powerful features
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: ImageIcon,
                  title: "Smart Recognition",
                  description: "Our AI accurately extracts event details from any image format - screenshots, photos, or PDFs."
                },
                {
                  icon: CursorArrowIcon,
                  title: "Intuitive Drag-and-Drop",
                  description: "Easily reschedule events by dragging them to new dates and times. Organize your calendar with simple, intuitive gestures."
                },
                {
                  icon: ClockIcon,
                  title: "Time-Saving",
                  description: "Reduce manual entry time by up to 90% with automated event creation."
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-white to-[#C2EABD]/10 border border-[#C2EABD] relative overflow-hidden group hover:shadow-lg hover:shadow-[#C2EABD]/20 transition-all duration-300">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-3 rounded-lg bg-[#011936]">
                        <feature.icon className="w-6 h-6 text-[#C2EABD]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#011936]">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section ref={demoSectionRef} className="py-24 px-4 bg-[#011936]">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4 text-[#C2EABD]">Try It Now</h2>
              <p className="text-[#C2EABD]/80">
                Upload an image and see how our AI extracts calendar events in seconds
              </p>
            </motion.div>

            <motion.div
              ref={uploadRef}
              className="relative [perspective:800px]"
              onMouseMove={handleUploadMouseMove}
              onMouseEnter={() => uploadScale.set(1.02)}
              onMouseLeave={() => {
                uploadScale.set(1);
                uploadRotateX.set(0);
                uploadRotateY.set(0);
              }}
            >
              <motion.div
                className="[transform-style:preserve-3d]"
                style={{ rotateX: uploadRotateX, rotateY: uploadRotateY, scale: uploadScale }}
              >
                <Card className="p-8 bg-white/10 backdrop-blur-sm border border-[#C2EABD]/20">
                  <FileUpload onChange={handleFileUpload} />
                  
                  {isProcessing && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-[#C2EABD]">
                      <Loader2Icon className="w-5 h-5 animate-spin" />
                      <span>Processing image...</span>
                    </div>
                  )}

                  {extractedEvents.length > 0 && (
                    <div className="mt-8 space-y-6">
                      <h3 className="text-xl font-semibold mb-4 text-[#C2EABD]">Extracted Events</h3>
                      {extractedEvents.map((event, index) => (
                        <Card key={index} className="p-6 bg-white/5 border border-[#C2EABD]/20 hover:bg-white/10 transition-colors">
                          <div className="space-y-4">
                            {/* Event Title */}
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-[#C2EABD]/20 rounded-lg">
                                <CalendarIcon className="w-5 h-5 text-[#C2EABD]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-[#C2EABD]">{event.title}</h4>
                                <p className="text-sm text-[#C2EABD]/70 mt-1">
                                  {event.date.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Time Information */}
                            {(event.startTime || event.endTime) && (
                              <div className="flex items-center gap-3 pl-11">
                                <Clock className="w-4 h-4 text-[#C2EABD]/70" />
                                <div className="text-sm text-[#C2EABD]/80">
                                  {event.startTime && event.endTime ? (
                                    <span>
                                      {formatTimeForDisplay(event.startTime)} - {formatTimeForDisplay(event.endTime)}
                                    </span>
                                  ) : event.startTime ? (
                                    <span>Starts at {formatTimeForDisplay(event.startTime)}</span>
                                  ) : (
                                    <span>Ends at {formatTimeForDisplay(event.endTime)}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Description */}
                            {event.description && (
                              <div className="flex items-start gap-3 pl-11">
                                <FileText className="w-4 h-4 text-[#C2EABD]/70 mt-0.5" />
                                <div className="text-sm text-[#C2EABD]/80 leading-relaxed">
                                  {event.description}
                                </div>
                              </div>
                            )}

                            {/* AI Confidence Indicator */}
                            <div className="flex items-center gap-2 pl-11 pt-2 border-t border-[#C2EABD]/20">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-xs text-[#C2EABD]/60">
                                AI extracted with high confidence
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      {/* Call to Action */}
                      <div className="text-center pt-4">
                        <p className="text-[#C2EABD]/80 mb-4">
                          Ready to add these events to your calendar?
                        </p>
                        <Button 
                          onClick={handleGetStarted}
                          className="bg-[#C2EABD] hover:bg-[#A3D5FF] text-[#011936] px-6 py-3 font-medium"
                        >
                          Sign Up to Save Events
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-[#C2EABD] relative">
          <div className="container mx-auto max-w-6xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#011936]">
                Benefits That Make a Difference
              </h2>
              <p className="text-[#011936]/80 max-w-2xl mx-auto">
                See how PicSchedule transforms your calendar management
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                "Save hours of manual data entry each week",
                "Reduce scheduling errors with AI accuracy",
                "Access your schedule from any device",
                "Drag and drop events to reschedule instantly",
                "Keep your data secure with encryption",
                "Get 24/7 customer support"
              ].map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-lg"
                >
                  <CheckCircledIcon className="w-6 h-6 text-[#011936]" />
                  <p className="text-[#011936] font-medium">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-[#011936] relative">
          <div className="container mx-auto max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#C2EABD]">
                Frequently Asked Questions
              </h2>
              <p className="text-[#C2EABD]/80 max-w-2xl mx-auto">
                Find answers to common questions about PicSchedule
              </p>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  q: "What types of images can I upload?",
                  a: "You can upload any image containing event information, including screenshots of emails, digital tickets, event invitations, and physical documents. Our AI can process both digital and printed text."
                },
                {
                  q: "How accurate is the information extraction?",
                  a: "Our AI is highly accurate and continuously improving. It's specifically trained to recognize common date formats, times, locations, and event details. You can always review and edit the extracted information before adding it to your calendar."
                },
                {
                  q: "Can I reschedule events after they're created?",
                  a: "Absolutely! PicSchedule features intuitive drag-and-drop functionality that lets you easily move events to different dates and times. Simply drag an event to its new position on the calendar."
                },
                {
                  q: "Is my data secure?",
                  a: "Yes, we take security seriously. All uploaded images are encrypted, processed securely, and automatically deleted after processing. We never store your calendar data or personal information without your explicit consent."
                }
              ].map((faq, index) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 bg-white/5 backdrop-blur-sm border border-[#C2EABD]/20">
                    <h3 className="text-lg font-semibold mb-3 text-[#C2EABD]">{faq.q}</h3>
                    <p className="text-[#C2EABD]/80">{faq.a}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mt-16"
            >
              <div className="p-8 rounded-2xl bg-gradient-to-br from-[#C2EABD] to-[#A3D5FF] relative overflow-hidden">
                <AnimatedGridPattern 
                  className="opacity-30 mix-blend-overlay" 
                  width={30} 
                  height={30} 
                  numSquares={30}
                  maxOpacity={0.4}
                  duration={5}
                />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 text-[#011936]">
                    Ready to transform your scheduling?
                  </h3>
                  <p className="text-[#011936]/90 mb-6 max-w-2xl mx-auto">
                    Join thousands of users who are already saving time with PicSchedule
                  </p>
                  <motion.button
                    onClick={handleGetStarted}
                    disabled={isNavigating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#011936] text-[#C2EABD] px-8 py-3 rounded-lg font-medium hover:bg-[#011936]/90 transition-colors disabled:opacity-50"
                  >
                    {isNavigating ? (
                      <>
                        <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Get Started for Free'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}