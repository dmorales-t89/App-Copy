'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';

export default function DemoSection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<null | {
    title: string;
    date: string;
    time: string;
    location: string;
  }>(null);

  const handleUpload = (files: File[]) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setPreviewEvent({
        title: "Team Meeting",
        date: "March 15, 2024",
        time: "2:00 PM",
        location: "Conference Room A"
      });
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <section className="py-24 bg-[#F5F5F5]">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Try it out!
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            See how PicScheduler automatically extracts event information
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <FileUpload onChange={handleUpload} />
          </motion.div>

          {/* Preview Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 bg-white border border-gray-200">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">Calendar Preview</h3>
              {previewEvent ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#C2EABD]/10">
                    <h4 className="font-semibold mb-2 text-gray-900">{previewEvent.title}</h4>
                    <div className="space-y-2 text-gray-700">
                      <p>📅 {previewEvent.date}</p>
                      <p>⏰ {previewEvent.time}</p>
                      <p>📍 {previewEvent.location}</p>
                    </div>
                  </div>
                  <Button className="w-full bg-[#2B82D4] hover:bg-[#236AAD] text-white">
                    Add to Calendar
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-700">
                  <p>Upload an image to see the extracted event details</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 