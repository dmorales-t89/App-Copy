'use client';

import React, { useState, useEffect } from 'react';
import { CalendarLayout } from '@/components/Calendar/CalendarLayout';
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
  description?: string;
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
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  color: string;
  groupId: string;
  description: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [groups] = useState<CalendarGroup[]>([
    { id: '1', name: 'Work', color: '#3B82F6' },
    { id: '2', name: 'Personal', color: '#10B981' },
    { id: '3', name: 'Family', color: '#EF4444' },
    { id: '4', name: 'Health', color: '#8B5CF6' },
    { id: '5', name: 'Education', color: '#F59E0B' },
  ]);
  const supabase = createClientComponentClient<Database>();
  const { user } = useAuth();
  const router = useRouter();

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const newEvent = {
        title: eventData.title,
        date: format(eventData.startDate, 'yyyy-MM-dd'),
        start_time: eventData.isAllDay ? null : format(eventData.startDate, 'HH:mm'),
        end_time: eventData.isAllDay ? null : format(eventData.endDate, 'HH:mm'),
        color: eventData.color,
        group_id: eventData.groupId,
        notes: eventData.description,
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
          notes: data.notes || undefined,
          description: data.notes || undefined
        };
        setEvents(prev => [...prev, transformedEvent]);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: EventFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedEvent = {
        title: eventData.title,
        date: format(eventData.startDate, 'yyyy-MM-dd'),
        start_time: eventData.isAllDay ? null : format(eventData.startDate, 'HH:mm'),
        end_time: eventData.isAllDay ? null : format(eventData.endDate, 'HH:mm'),
        color: eventData.color,
        group_id: eventData.groupId,
        notes: eventData.description
      };

      const { data, error } = await supabase
        .from('events')
        .update(updatedEvent)
        .eq('id', eventId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
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
          notes: data.notes || undefined,
          description: data.notes || undefined
        };
        setEvents(prev => prev.map(event => 
          event.id === eventId ? transformedEvent : event
        ));
      }
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting event:', error);
        return;
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsLoading(false);
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
            notes: event.notes || undefined,
            description: event.notes || undefined
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
        groups={groups}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        isLoading={isLoading}
      />
    </div>
  );
}