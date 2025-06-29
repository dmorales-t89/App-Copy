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
  isRepeating: boolean;
  repeatFrequency: 'daily' | 'weekly' | 'monthly' | '';
  repeatEndDate: Date | null;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [groups] = useState<CalendarGroup[]>([
    { id: '1', name: 'Work', color: '#AEC6CF' }, // Pastel Blue
    { id: '2', name: 'Personal', color: '#77DD77' }, // Pastel Green
    { id: '3', name: 'Family', color: '#FF6961' }, // Pastel Red/Coral
    { id: '4', name: 'Health', color: '#B39EB5' }, // Pastel Purple
    { id: '5', name: 'Education', color: '#FDFD96' }, // Pastel Yellow
  ]);
  const supabase = createClientComponentClient<Database>();
  const { user } = useAuth();
  const router = useRouter();

  const handleCreateEvent = async (eventData: EventFormData) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating event with data:', eventData);
      
      const newEvent = {
        title: eventData.title,
        date: format(eventData.startDate, 'yyyy-MM-dd'),
        start_time: eventData.isAllDay ? null : eventData.startTime,
        end_time: eventData.isAllDay ? null : eventData.endTime,
        color: eventData.color,
        group_id: eventData.groupId,
        notes: eventData.description,
        user_id: user.id,
        image_url: null
      };

      console.log('Inserting event into database:', newEvent);

      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      console.log('Event created successfully:', data);

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
        console.log('Event added to state:', transformedEvent);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: EventFormData) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Updating event:', eventId, 'with data:', eventData);
      
      const updatedEvent = {
        title: eventData.title,
        date: format(eventData.startDate, 'yyyy-MM-dd'),
        start_time: eventData.isAllDay ? null : eventData.startTime,
        end_time: eventData.isAllDay ? null : eventData.endTime,
        color: eventData.color,
        group_id: eventData.groupId,
        notes: eventData.description
      };

      console.log('Updating event in database:', updatedEvent);

      const { data, error } = await supabase
        .from('events')
        .update(updatedEvent)
        .eq('id', eventId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      console.log('Event updated successfully:', data);

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
        console.log('Event updated in state:', transformedEvent);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Deleting event:', eventId);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting event:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      console.log('Event deleted successfully');
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      console.log('No user, redirecting to login');
      router.push('/login');
      return;
    }

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching events for user:', user.id);
        
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return;
        }

        console.log('Fetched events from database:', data);

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
          console.log('Events loaded into state:', transformedEvents);
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