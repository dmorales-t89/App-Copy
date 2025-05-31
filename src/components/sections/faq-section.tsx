'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AnimatedGridPattern } from '@/components/ui/animated-grid';

const faqs = [
  {
    question: "What types of images can I upload?",
    answer: "You can upload any image containing event information, including screenshots of emails, digital tickets, event invitations, and physical documents. Our AI can process both digital and printed text."
  },
  {
    question: "How accurate is the information extraction?",
    answer: "Our AI is highly accurate and continuously improving. It's specifically trained to recognize common date formats, times, locations, and event details. You can always review and edit the extracted information before adding it to your calendar."
  },
  {
    question: "Which calendar apps are supported?",
    answer: "PicScheduler integrates with all major calendar applications including Google Calendar, Apple Calendar, Microsoft Outlook, and any calendar that supports .ics files."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we take security seriously. All uploaded images are encrypted, processed securely, and automatically deleted after processing. We never store your calendar data or personal information without your explicit consent."
  }
];

export default function FAQSection() {
  return (
    <section className="py-24 bg-[#011936]">
      <div className="container mx-auto max-w-6xl px-4">
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
            Everything you need to know about PicScheduler
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white/5 backdrop-blur-sm border border-[#C2EABD]/20 hover:border-[#C2EABD]/40 transition-colors">
                <h3 className="text-lg font-semibold mb-3 text-[#C2EABD]">{faq.question}</h3>
                <p className="text-[#C2EABD]/80">{faq.answer}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
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
                Ready to simplify your scheduling?
              </h3>
              <p className="text-[#011936]/90 mb-6 max-w-2xl mx-auto">
                Join thousands of users who are already saving time with PicScheduler
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#011936] text-[#C2EABD] px-8 py-3 rounded-lg font-medium hover:bg-[#011936]/90 transition-colors"
              >
                Get Started for Free
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 