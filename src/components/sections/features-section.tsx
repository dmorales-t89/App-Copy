'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ImageIcon, CalendarIcon, StarIcon, ClockIcon } from '@radix-ui/react-icons';
import { AnimatedGridPattern } from '@/components/ui/animated-grid';

const features = [
  {
    icon: ImageIcon,
    title: 'Smart Image Recognition',
    description: 'Upload any image or screenshot containing event details, and our AI will automatically extract the important information.'
  },
  {
    icon: CalendarIcon,
    title: 'Instant Calendar Events',
    description: 'Automatically create calendar events with all the extracted details, saving you time and reducing errors.'
  },
  {
    icon: StarIcon,
    title: 'AI-Powered Accuracy',
    description: 'Our advanced AI ensures accurate extraction of dates, times, locations, and other event details from your images.'
  },
  {
    icon: ClockIcon,
    title: 'Time-Saving Automation',
    description: 'Stop manually entering event details. Let PicScheduler handle the scheduling while you focus on what matters.'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#011936]">
            Scheduling Made Simple
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform the way you manage your calendar with our powerful features
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 bg-gradient-to-br from-white to-[#C2EABD]/10 border border-[#C2EABD] relative overflow-hidden group hover:shadow-lg hover:shadow-[#C2EABD]/20 transition-all duration-300">
                <AnimatedGridPattern 
                  className="opacity-30 group-hover:opacity-50 transition-opacity duration-300" 
                  width={20} 
                  height={20} 
                  numSquares={15}
                  maxOpacity={0.2}
                  duration={3}
                />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 rounded-lg bg-[#011936]">
                    <feature.icon className="w-6 h-6 text-[#C2EABD]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-[#011936]">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 