'use client';

import React, { useState } from 'react';
import { format, addMonths, subMonths, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { WeekView } from './WeekView';
import { EventForm } from './EventForm';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Event } from '@/types/calendar';

interface Group {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
}

interface EventData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  color: string;
}

interface CalendarLayoutProps {
  events: Event[];
  onAddEvent: (date: Date) => void;
  onDeleteEvent?: (eventId: string) => void;
  isLoading?: boolean;
}

export function CalendarLayout({ events, onAddEvent, onDeleteEvent, isLoading = false }: CalendarLayoutProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [groups, setGroups] = useState<Group[]>([
    { id: '1', name: 'Work', color: 'bg-blue-500', isVisible: true },
    { id: '2', name: 'Personal', color: 'bg-emerald-500', isVisible: true },
    { id: '3', name: 'Family', color: 'bg-red-500', isVisible: true },
  ]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour);
    setSelectedDate(newDate);
    setShowEventForm(true);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      view === 'month' 
        ? (direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
        : addDays(prev, direction === 'prev' ? -7 : 7)
    );
  };

  const toggleGroupVisibility = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId ? { ...group, isVisible: !group.isVisible } : group
    ));
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Left Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-[300px] border-r border-[#C2EABD] p-6 bg-white"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[#011936] mb-4">Calendars</h2>
                <div className="space-y-3">
                  {groups.map(group => (
                    <div key={group.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={group.isVisible}
                        onChange={() => toggleGroupVisibility(group.id)}
                        className="rounded-full data-[state=checked]:bg-[#C2EABD] data-[state=checked]:text-[#011936]"
                      />
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-3 h-3 rounded-full", group.color)} />
                        <span className="text-sm font-medium text-[#011936]">{group.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#C2EABD]">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-[#C2EABD]/10 text-[#011936]"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={() => {
                setSelectedDate(new Date());
                setShowEventForm(true);
              }}
              className="bg-[#C2EABD] hover:bg-[#C2EABD]/90 text-[#011936]"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateChange('prev')}
                className="hover:bg-[#C2EABD]/10 text-[#011936]"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-[#011936] min-w-[140px] text-center">
                {format(selectedDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateChange('next')}
                className="hover:bg-[#C2EABD]/10 text-[#011936]"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setSelectedDate(new Date());
                  if (view === 'month') {
                    handleDayClick(new Date());
                  } else {
                    handleTimeSlotClick(new Date(), new Date().getHours());
                  }
                }}
                className="bg-[#C2EABD] hover:bg-[#C2EABD]/90 text-[#011936] font-medium"
              >
                Today
              </Button>
            </div>
            {isLoading && (
              <Loader2 className="h-5 w-5 text-[#011936] animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              className={cn(
                view === 'month'
                  ? "bg-[#C2EABD] hover:bg-[#C2EABD]/90"
                  : "hover:bg-[#C2EABD]/10",
                "text-[#011936] font-medium"
              )}
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              className={cn(
                view === 'week'
                  ? "bg-[#C2EABD] hover:bg-[#C2EABD]/90"
                  : "hover:bg-[#C2EABD]/10",
                "text-[#011936] font-medium"
              )}
              onClick={() => setView('week')}
            >
              Week
            </Button>
          </div>
        </header>

        {/* Calendar Content */}
        <div className="flex-1 overflow-hidden">
          <div className={cn(
            "h-full transition-all duration-300",
            showEventForm && "mr-[350px]"
          )}>
            {view === 'month' ? (
              <CalendarView
                currentDate={selectedDate}
                events={events.filter(event => 
                  groups.find(g => g.id === event.groupId)?.isVisible
                )}
                onAddEvent={handleDayClick}
                visibleGroups={groups.filter(g => g.isVisible).map(g => g.id)}
                groups={groups.map(({ id, name, color }) => ({ id, name, color }))}
              />
            ) : (
              <WeekView
                currentDate={selectedDate}
                events={events.filter(event => 
                  groups.find(g => g.id === event.groupId)?.isVisible
                )}
                onTimeSlotClick={handleTimeSlotClick}
              />
            )}
          </div>

          {/* Event Form */}
          <AnimatePresence>
            {showEventForm && (
              <motion.div
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                exit={{ x: 400 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-[350px] bg-white shadow-lg border-l border-[#C2EABD] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-[#011936]">Create Event</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEventForm(false)}
                      className="hover:bg-[#C2EABD]/10 text-[#011936]"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <EventForm
                    key={selectedDate.toISOString()}
                    initialDate={selectedDate}
                    onSubmit={(data) => {
                      onAddEvent(data.startDate);
                      setShowEventForm(false);
                    }}
                    onCancel={() => setShowEventForm(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 