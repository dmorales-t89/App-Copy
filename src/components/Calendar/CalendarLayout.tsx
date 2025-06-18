'use client';

import React, { useState } from 'react';
import { format, addMonths, subMonths, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Search, Menu, Settings } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { WeekView } from './WeekView';
import { EventForm } from './EventForm';
import { ImageScanButton } from './ImageScanButton';
import { ExtractedEventsSidebar } from './ExtractedEventsSidebar';
import { cn } from '@/lib/utils';
import { MiniCalendar } from '@/components/ui/mini-calendar';
import { Input } from '@/components/ui/input';
import { Event } from '@/types/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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

interface ExtractedEvent {
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  description?: string;
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
  
  // New state for extracted events
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const [showExtractedEventsSidebar, setShowExtractedEventsSidebar] = useState(false);

  const { signOut } = useAuth();
  const router = useRouter();

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

  // Handle extracted events from image scanning
  const handleEventsExtracted = (events: ExtractedEvent[]) => {
    console.log('Events extracted from image:', events);
    setExtractedEvents(events);
    setShowExtractedEventsSidebar(true);
  };

  const handleConfirmExtractedEvent = async (eventData: EventFormData) => {
    console.log('Confirming extracted event:', eventData);
    await onCreateEvent(eventData);
  };

  const handleDiscardExtractedEvent = (index: number) => {
    setExtractedEvents(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAllExtractedEvents = async () => {
    console.log('Confirming all extracted events');
    
    for (const event of extractedEvents) {
      const eventData: EventFormData = {
        title: event.title,
        description: event.description || '',
        startDate: event.date,
        endDate: event.date,
        isAllDay: !event.startTime,
        startTime: event.startTime || '09:00',
        endTime: event.endTime || (event.startTime ? format(new Date(`2000-01-01T${event.startTime}`).getTime() + 60 * 60 * 1000, 'HH:mm') : '10:00'),
        color: groups[0]?.color || '#AEC6CF',
        groupId: groups[0]?.id || '1',
      };
      
      await onCreateEvent(eventData);
    }
    
    setExtractedEvents([]);
    setShowExtractedEventsSidebar(false);
  };

  const handleDiscardAllExtractedEvents = () => {
    setExtractedEvents([]);
    setShowExtractedEventsSidebar(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const groupVisible = groups.find(g => g.id === event.groupId)?.isVisible !== false;
    return matchesSearch && groupVisible;
  });

  return (
    <div className="h-screen flex bg-white">
      {/* Left Sidebar - Google Calendar Style */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-[280px] border-r border-gray-200 bg-gray-50 overflow-y-auto"
          >
            <div className="p-4 space-y-6">
              {/* Create Button - Google Calendar Style */}
              <Button
                onClick={() => {
                  onDateChange(new Date());
                  setEditingEvent(null);
                  setShowEventForm(true);
                }}
                className="w-full justify-start bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full px-6 py-3 font-medium shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="h-5 w-5 mr-3 text-gray-600" />
                Create
              </Button>

              {/* Mini Calendar - Google Calendar Style */}
              <div className="space-y-4">
                <MiniCalendar
                  selectedDate={selectedDate}
                  onDateSelect={onDateChange}
                />
              </div>

              {/* Search */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search events"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 rounded-lg bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Image Scan Button */}
              <div className="space-y-3">
                <ImageScanButton onEventsExtracted={handleEventsExtracted} />
              </div>

              {/* My Calendars - Google Calendar Style */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 px-1">My calendars</h3>
                <div className="space-y-1">
                  {groups.map(group => (
                    <div 
                      key={group.id} 
                      className="flex items-center space-x-3 py-2 px-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => toggleGroupVisibility(group.id)}
                    >
                      <input
                        type="checkbox"
                        checked={group.isVisible}
                        onChange={() => toggleGroupVisibility(group.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-sm text-gray-700 font-medium">
                          {group.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => onDateChange(new Date())}
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:bg-gray-100 font-normal"
                >
                  Go to Today
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - This entire section shifts when sidebar opens */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        showEventForm && "mr-[400px]"
      )}>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            {/* Settings Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100 text-gray-600"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-gray-700 hover:bg-gray-100"
                >
                  Log out
                </Button>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-gray-100 text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateChange('prev')}
                className="hover:bg-gray-100 text-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateChange('next')}
                className="hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => onDateChange(new Date())}
                className="bg-[#A3D5FF] hover:bg-[#A3D5FF]/90 text-[#011936] font-medium px-4 border border-[#A3D5FF]"
              >
                Today
              </Button>
              <h2 className="text-xl font-normal text-gray-900 ml-4">
                {format(selectedDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
              </h2>
            </div>
            
            {isLoading && (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="border border-gray-300 rounded-lg p-1 flex bg-white">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "px-4 py-2 rounded-md transition-all text-sm",
                  view === 'month'
                    ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm"
                    : "hover:bg-gray-100 text-gray-700",
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
                  "px-4 py-2 rounded-md transition-all text-sm",
                  view === 'week'
                    ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm"
                    : "hover:bg-gray-100 text-gray-700",
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
      </div>

      {/* Event Form Sidebar */}
      <AnimatePresence>
        {showEventForm && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[400px] bg-white/95 backdrop-blur-sm shadow-lg border-l border-gray-200 overflow-y-auto z-50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                  }}
                  className="hover:bg-gray-100 text-gray-600"
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

      {/* Extracted Events Sidebar */}
      <ExtractedEventsSidebar
        isOpen={showExtractedEventsSidebar}
        events={extractedEvents}
        groups={groups}
        onClose={() => setShowExtractedEventsSidebar(false)}
        onConfirmEvent={handleConfirmExtractedEvent}
        onDiscardEvent={handleDiscardExtractedEvent}
        onConfirmAll={handleConfirmAllExtractedEvents}
        onDiscardAll={handleDiscardAllExtractedEvents}
      />
    </div>
  );
}