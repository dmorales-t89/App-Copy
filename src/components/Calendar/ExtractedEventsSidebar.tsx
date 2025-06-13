'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Calendar, CheckCircle } from 'lucide-react';
import { ExtractedEventCard } from './ExtractedEventCard';

interface ExtractedEvent {
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  color: string;
  groupId: string;
}

interface ExtractedEventsSidebarProps {
  isOpen: boolean;
  events: ExtractedEvent[];
  groups: Group[];
  onClose: () => void;
  onConfirmEvent: (eventData: EventFormData) => void;
  onDiscardEvent: (index: number) => void;
  onConfirmAll: () => void;
  onDiscardAll: () => void;
}

export function ExtractedEventsSidebar({
  isOpen,
  events,
  groups,
  onClose,
  onConfirmEvent,
  onDiscardEvent,
  onConfirmAll,
  onDiscardAll,
}: ExtractedEventsSidebarProps) {
  const handleConfirmEvent = (eventData: EventFormData, index: number) => {
    onConfirmEvent(eventData);
    onDiscardEvent(index); // Remove from extracted events after confirming
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[450px] bg-white shadow-xl border-l border-gray-200 overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#C2EABD]/10 to-[#A3D5FF]/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-[#C2EABD] to-[#A3D5FF] rounded-lg">
                  <Sparkles className="h-5 w-5 text-[#011936]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Extracted Events
                  </h2>
                  <p className="text-sm text-gray-600">
                    {events.length} event{events.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-gray-100 text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No events to review
                  </h3>
                  <p className="text-gray-600 max-w-sm">
                    Upload an image with event details to see extracted events here for review.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Success Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Events extracted successfully!
                        </p>
                        <p className="text-sm text-green-700">
                          Review and edit the details below, then add them to your calendar.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Event Cards */}
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <ExtractedEventCard
                        key={index}
                        event={event}
                        groups={groups}
                        onConfirm={(eventData) => handleConfirmEvent(eventData, index)}
                        onDiscard={() => onDiscardEvent(index)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {events.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between space-x-3">
                  <Button
                    variant="outline"
                    onClick={onDiscardAll}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Discard All
                  </Button>
                  <Button
                    onClick={onConfirmAll}
                    className="flex-1 bg-[#1a73e8] text-white hover:bg-[#1557b0]"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add All to Calendar
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Or review each event individually above
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}