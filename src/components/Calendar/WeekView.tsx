import React from 'react';
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/calendar';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: Event) => void;
}

export function WeekView({ currentDate, events, onTimeSlotClick, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getHourEvents = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      if (!isSameDay(eventDate, date)) return false;
      
      if (!event.startTime) return hour === 0; // All-day events show at midnight
      
      const eventHour = parseInt(event.startTime.split(':')[0], 10);
      return eventHour === hour;
    });
  };

  const getEventColor = (event: Event) => {
    return event.color || '#3B82F6';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Week header */}
      <div className="grid grid-cols-[80px_1fr] border-b border-[#C2EABD]">
        <div className="p-3 bg-gray-50" />
        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="p-3 text-center border-l border-[#C2EABD]/20 first:border-l-0 bg-gray-50"
            >
              <div className="text-sm font-medium text-[#011936]">{format(day, 'EEE')}</div>
              <div className={cn(
                "text-lg font-semibold mt-1 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                isSameDay(day, new Date()) ? "bg-[#C2EABD] text-[#011936]" : "text-[#011936]"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[80px_1fr]">
          {/* Time labels */}
          <div className="divide-y divide-[#C2EABD]/20">
            {hours.map((hour) => (
              <div key={hour} className="h-16 p-2 bg-gray-50">
                <span className="text-xs text-[#011936]/70">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="grid grid-cols-7 divide-x divide-[#C2EABD]/20">
            {weekDays.map((day) => (
              <div key={day.toString()} className="divide-y divide-[#C2EABD]/20">
                {hours.map((hour) => {
                  const hourEvents = getHourEvents(day, hour);
                  return (
                    <div
                      key={hour}
                      className="h-16 p-1 hover:bg-[#C2EABD]/5 cursor-pointer relative"
                      onClick={() => onTimeSlotClick(day, hour)}
                    >
                      {hourEvents.map((event, index) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ 
                            backgroundColor: getEventColor(event), 
                            color: '#ffffff'
                          }}
                          title={`${event.title}${event.startTime ? ` at ${event.startTime}` : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {event.startTime && event.endTime && (
                            <div className="text-xs opacity-90">
                              {format(new Date(`2000-01-01T${event.startTime}`), 'h:mm a')} - 
                              {format(new Date(`2000-01-01T${event.endTime}`), 'h:mm a')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}