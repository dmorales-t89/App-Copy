'use client';

import React, { useState } from 'react';
import { format, addMonths, subMonths, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Search } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { WeekView } from './WeekView';
import { EventForm } from './EventForm';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Event } from '@/types/calendar';

interface Group {
  id: string;
  name: string;
  color: string;
  isVisible?: boolean;
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

interface CalendarLayoutProps {
  events: Event[];
  groups: Group[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent: (eventData: EventFormData) => void;
  onUpdateEvent: (eventId: string, eventData: EventFormData) => void;
  onDeleteEvent: (eventId: string) => void;
  isLoading?: boolean;
}

export function CalendarLayout({ 
  events, 
  groups: initialGroups, 
  selectedDate, 
  onDateChange, 
  onCreateEvent, 
  onUpdateEvent, 
  onDeleteEvent, 
  isLoading = false 
}: CalendarLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>(
    initialGroups.map(group => ({ ...group, isVisible: true }))
  );

  const handleDayClick = (date: Date) => {
    onDateChange(date);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour);
    onDateChange(newDate);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    onDateChange(
      view === 'month' 
        ? (direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1))
        : addDays(selectedDate, direction === 'prev' ? -7 : 7)
    );
  };

  const handleFormSubmit = async (eventData: EventFormData) => {
    if (editingEvent) {
      await onUpdateEvent(editingEvent.id, eventData);
    } else {
      await onCreateEvent(eventData);
    }
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleFormDelete = async () => {
    if (editingEvent) {
      await onDeleteEvent(editingEvent.id);
      setShowEventForm(false);
      setEditingEvent(null);
    }
  };

  const toggleGroupVisibility = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId ? { ...group, isVisible: !group.isVisible } : group
    ));
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const groupVisible = groups.find(g => g.id === event.groupId)?.isVisible !== false;
    return matchesSearch && groupVisible;
  });

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
            className="w-[300px] border-r border-[#C2EABD] p-6 bg-white overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Mini Calendar */}
              <div>
                <h3 className="text-sm font-semibold text-[#011936] mb-3">Calendar</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onDateChange(date)}
                  month={selectedDate}
                  onMonthChange={onDateChange}
                  className="rounded-md border border-[#C2EABD]"
                />
              </div>

              {/* Search */}
              <div>
                <h3 className="text-sm font-semibold text-[#011936] mb-3">Search Events</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-[#C2EABD]"
                  />
                </div>
              </div>

              {/* Calendar Groups */}
              <div>
                <h3 className="text-sm font-semibold text-[#011936] mb-3">My Calendars</h3>
                <div className="space-y-3">
                  {groups.map(group => (
                    <div key={group.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={group.isVisible}
                        onChange={() => toggleGroupVisibility(group.id)}
                        className="rounded"
                      />
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-sm font-medium text-[#011936]">{group.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-[#011936] mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      onDateChange(new Date());
                      setEditingEvent(null);
                      setShowEventForm(true);
                    }}
                    className="w-full justify-start bg-[#C2EABD] hover:bg-[#C2EABD]/90 text-[#011936]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                  <Button
                    onClick={() => onDateChange(new Date())}
                    variant="outline"
                    className="w-full justify-start border-[#C2EABD] text-[#011936] hover:bg-[#C2EABD]/10"
                  >
                    Go to Today
                  </Button>
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
                onDateChange(new Date());
                setEditingEvent(null);
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
                onClick={() => onDateChange(new Date())}
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
            <div className="border-2 border-[#C2EABD] rounded-lg p-1 flex bg-gray-50">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "px-4 py-2 rounded-md transition-all",
                  view === 'month'
                    ? "bg-[#C2EABD] hover:bg-[#C2EABD]/90 text-[#011936] shadow-sm"
                    : "hover:bg-[#C2EABD]/10 text-[#011936]",
                  "font-medium"
                )}
                onClick={() => setView('month')}
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "px-4 py-2 rounded-md transition-all",
                  view === 'week'
                    ? "bg-[#C2EABD] hover:bg-[#C2EABD]/90 text-[#011936] shadow-sm"
                    : "hover:bg-[#C2EABD]/10 text-[#011936]",
                  "font-medium"
                )}
                onClick={() => setView('week')}
              >
                Week
              </Button>
            </div>
          </div>
        </header>

        {/* Calendar Content */}
        <div className="flex-1 overflow-hidden">
          <div className={cn(
            "h-full transition-all duration-300",
            showEventForm && "mr-[400px]"
          )}>
            {view === 'month' ? (
              <CalendarView
                currentDate={selectedDate}
                events={filteredEvents}
                onAddEvent={handleDayClick}
                onEventClick={handleEventClick}
                groups={groups}
              />
            ) : (
              <WeekView
                currentDate={selectedDate}
                events={filteredEvents}
                onTimeSlotClick={handleTimeSlotClick}
                onEventClick={handleEventClick}
              />
            )}
          </div>

          {/* Event Form Sidebar */}
          <AnimatePresence>
            {showEventForm && (
              <motion.div
                initial={{ x: 400 }}
                animate={{ x: 0 }}
                exit={{ x: 400 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg border-l border-[#C2EABD] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-[#011936]">
                      {editingEvent ? 'Edit Event' : 'Create Event'}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowEventForm(false);
                        setEditingEvent(null);
                      }}
                      className="hover:bg-[#C2EABD]/10 text-[#011936]"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <EventForm
                    key={editingEvent?.id || 'new'}
                    initialDate={selectedDate}
                    editingEvent={editingEvent}
                    groups={groups}
                    onSubmit={handleFormSubmit}
                    onDelete={handleFormDelete}
                    onCancel={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                    }}
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