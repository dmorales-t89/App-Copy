'use client';

import React, { useState, useEffect } from 'react';
import { CalendarLayout } from '@/components/Calendar/CalendarLayout';
import { useAuth } from '@/context/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/database.types';
import { format, addDays, addWeeks, addMonths, isBefore, parseISO, isSameDay } from 'date-fns';
import { isValidUuid } from '@/lib/utils';

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
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
  recurrenceEndDate?: string;
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

  // Maximum number of recurring events to generate (safety limit)
  const MAX_OCCURRENCES = 365;

  // Helper function to extract base event ID from recurring event ID
  const extractBaseEventId = (eventId: string): string => {
    // If it's a recurring event ID (format: uuid-yyyy-MM-dd), extract the UUID part
    if (eventId.includes('-') && eventId.length > 36) {
      // Find the last occurrence of a date pattern (yyyy-MM-dd)
      const datePattern = /-\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(eventId)) {
        return eventId.replace(datePattern, '');
      }
    }
    // If it's already a base UUID, return as is
    return eventId;
  };

  const generateRecurringEvents = (baseEvent: Event): Event[] => {
    if (!baseEvent.recurrenceRule || !baseEvent.recurrenceEndDate) {
      return [baseEvent];
    }

    const events: Event[] = [baseEvent]; // Include the original event
    const startDate = parseISO(baseEvent.date);
    const endDate = parseISO(baseEvent.recurrenceEndDate);
    let currentDate = startDate;
    let occurrenceCount = 0;

    while (isBefore(currentDate, endDate) && occurrenceCount < MAX_OCCURRENCES) {
      // Calculate next occurrence date based on frequency
      switch (baseEvent.recurrenceRule) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          return events; // Invalid frequency, return original event only
      }

      // Don't create an occurrence if it's the same as the original event
      if (isSameDay(currentDate, startDate)) {
        continue;
      }

      // Don't create an occurrence if it's after the end date
      if (!isBefore(currentDate, endDate) && !isSameDay(currentDate, endDate)) {
        break;
      }

      // Create a new event instance for this occurrence
      const occurrenceEvent: Event = {
        ...baseEvent,
        id: `${baseEvent.id}-${format(currentDate, 'yyyy-MM-dd')}`, // Unique ID for occurrence
        date: format(currentDate, 'yyyy-MM-dd'),
      };

      events.push(occurrenceEvent);
      occurrenceCount++;
    }

    console.log(`Generated ${events.length - 1} recurring occurrences for event: ${baseEvent.title}`);
    return events;
  };

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
        image_url: null,
        // Add recurrence fields
        recurrence_rule: eventData.isRepeating ? eventData.repeatFrequency : null,
        recurrence_end_date: eventData.isRepeating && eventData.repeatEndDate 
          ? format(eventData.repeatEndDate, 'yyyy-MM-dd') 
          : null,
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
          description: data.notes || undefined,
          recurrenceRule: data.recurrence_rule || undefined,
          recurrenceEndDate: data.recurrence_end_date || undefined,
        };

        // Generate recurring events if applicable
        const allEventInstances = generateRecurringEvents(transformedEvent);
        
        // Add all instances to state (original + recurring)
        setEvents(prev => [...prev, ...allEventInstances]);
        console.log('Event and recurring instances added to state:', allEventInstances.length);
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
      
      // Extract the base event ID (remove occurrence suffix if present)
      const baseEventId = extractBaseEventId(eventId);
      
      // Validate UUID before making database call
      if (!isValidUuid(baseEventId)) {
        console.error('Invalid UUID format for event ID:', baseEventId);
        alert('Unable to update event: Invalid event ID format');
        return;
      }
      
      const updatedEvent = {
        title: eventData.title,
        date: format(eventData.startDate, 'yyyy-MM-dd'),
        start_time: eventData.isAllDay ? null : eventData.startTime,
        end_time: eventData.isAllDay ? null : eventData.endTime,
        color: eventData.color,
        group_id: eventData.groupId,
        notes: eventData.description,
        // Add recurrence fields
        recurrence_rule: eventData.isRepeating ? eventData.repeatFrequency : null,
        recurrence_end_date: eventData.isRepeating && eventData.repeatEndDate 
          ? format(eventData.repeatEndDate, 'yyyy-MM-dd') 
          : null,
      };

      console.log('Updating event in database:', updatedEvent);

      const { data, error } = await supabase
        .from('events')
        .update(updatedEvent)
        .eq('id', baseEventId)
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
          description: data.notes || undefined,
          recurrenceRule: data.recurrence_rule || undefined,
          recurrenceEndDate: data.recurrence_end_date || undefined,
        };

        // Remove all old instances of this event (original + recurring)
        setEvents(prev => prev.filter(event => 
          !event.id.startsWith(baseEventId)
        ));

        // Generate new recurring events if applicable
        const allEventInstances = generateRecurringEvents(transformedEvent);
        
        // Add all new instances to state
        setEvents(prev => [...prev, ...allEventInstances]);
        console.log('Event updated and recurring instances regenerated:', allEventInstances.length);
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
      
      // Extract the base event ID (remove occurrence suffix if present)
      const baseEventId = extractBaseEventId(eventId);
      
      console.log('Base event ID extracted:', baseEventId);
      
      // Validate UUID before making database call
      if (!isValidUuid(baseEventId)) {
        console.error('Invalid UUID format for event ID:', baseEventId);
        alert('Unable to delete event: Invalid event ID format');
        return;
      }
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', baseEventId)
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
      
      // Remove all instances of this event (original + recurring)
      setEvents(prev => prev.filter(event => 
        !event.id.startsWith(baseEventId)
      ));
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
          // Transform base events and generate recurring instances
          const allEvents: Event[] = [];
          
          data.forEach(event => {
            // Validate UUID before processing
            if (!isValidUuid(event.id)) {
              console.warn('Skipping event with invalid UUID:', event.id, event.title);
              return;
            }

            const transformedEvent: Event = {
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
              description: event.notes || undefined,
              recurrenceRule: event.recurrence_rule || undefined,
              recurrenceEndDate: event.recurrence_end_date || undefined,
            };

            // Generate recurring events if applicable
            const eventInstances = generateRecurringEvents(transformedEvent);
            allEvents.push(...eventInstances);
          });

          setEvents(allEvents);
          console.log('Events loaded into state (including recurring):', allEvents.length);
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