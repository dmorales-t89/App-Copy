'use client';

import React, { useState, useEffect } from 'react';
import { CalendarLayout } from '@/components/Calendar/CalendarLayout';
import { EventCreationDialog } from '@/components/Calendar/EventCreationDialog';
import { useAuth } from '@/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  imageUrl?: string;
  user_id: string;
  groupId: string;
  notes?: string;
}

interface CalendarGroup {
  id: string;
  name: string;
  color: string;
}

interface EventFormData {
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  imageUrl?: string;
  groupId: string;
  notes?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const supabase = createClientComponentClient<Database>();
  const { user } = useAuth();
  const router = useRouter();

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setIsEventDialogOpen(true);
  };

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newEvent = {
        title: eventData.title,
        date: format(eventData.startDate, 'yyyy-MM-dd'),
        start_time: format(eventData.startDate, 'HH:mm'),
        end_time: format(eventData.endDate, 'HH:mm'),
        color: eventData.color,
        image_url: eventData.imageUrl,
        group_id: eventData.groupId,
        notes: eventData.notes,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return;
      }

      if (data) {
        const transformedEvent: Event = {
          id: data.id,
          title: data.title,
          date: data.date,
          startTime: data.start_time || undefined,
          endTime: data.end_time || undefined,
          color: data.color,
          imageUrl: data.image_url || undefined,
          user_id: data.user_id,
          groupId: data.group_id,
          notes: data.notes || undefined
        };
        setEvents(prev => [...prev, transformedEvent]);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
      setIsEventDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching events:', error);
          return;
        }

        if (data) {
          const transformedEvents: Event[] = data.map(event => ({
            id: event.id,
            title: event.title,
            date: event.date,
            startTime: event.start_time || undefined,
            endTime: event.end_time || undefined,
            color: event.color,
            imageUrl: event.image_url || undefined,
            user_id: event.user_id,
            groupId: event.group_id,
            notes: event.notes || undefined
          }));
          setEvents(transformedEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [user, supabase, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50">
      <CalendarLayout 
        events={events}
        onAddEvent={handleAddEvent}
        isLoading={isLoading}
      />

      <EventCreationDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onCreateEvent={handleCreateEvent}
        selectedDate={selectedDate}
        groups={groups}
      />
    </div>
  );
} 