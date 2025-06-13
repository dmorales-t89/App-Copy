'use client';

import React, { useState } from 'react';
import { format, addMonths, subMonths, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Search, Menu } from 'lucide-react';
import { CalendarView } from './CalendarView';
import { WeekView } from './WeekView';
import { EventForm } from './EventForm';
import { cn } from '@/lib/utils';
import { MiniCalendar } from '@/components/ui/mini-calendar';
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
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-[280px] border-r border-gray-200 bg-white overflow-y-auto"
          >
            <div className="p-4 space-y-6">
              {/* Create Button */}
              <Button
                onClick={() => {
                  onDateChange(new Date());
                  setEditingEvent(null);
                  setShowEventForm(true);
                }}
                className="w-full justify-start bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full px-6 py-3 font-medium shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create
              </Button>

              {/* Mini Calendar */}
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
                    className="pl-10 border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              {/* My Calendars */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">My calendars</h3>
                <div className="space-y-2">
                  {groups.map(group => (
                    <div key={group.id} className="flex items-center space-x-3 py-1">
                      <input
                        type="checkbox"
                        checked={group.isVisible}
                        onChange={() => toggleGroupVisibility(group.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
                          {group.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Button
                    onClick={() => onDateChange(new Date())}
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-gray-100"
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
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
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
                className="hover:bg-gray-100 text-gray-600 font-medium px-4"
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
                className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg border-l border-gray-200 overflow-y-auto z-50"
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
        </div>
      </div>
    </div>
  );
}