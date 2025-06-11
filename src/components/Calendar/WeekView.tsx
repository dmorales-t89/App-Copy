import React from 'react';
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/calendar';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onTimeSlotClick: (date: Date, hour: number) => void;
}

export function WeekView({ currentDate, events, onTimeSlotClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getHourEvents = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      const eventHour = event.startTime ? parseInt(event.startTime.split(':')[0], 10) : null;
      return isSameDay(eventDate, date) && eventHour === hour;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Time column header */}
      <div className="grid grid-cols-[60px_1fr] border-b border-[#C2EABD]">
        <div className="p-2" />
        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="p-2 text-center text-sm font-medium text-[#011936] border-l border-[#C2EABD] first:border-l-0"
            >
              <div>{format(day, 'EEE')}</div>
              <div className="text-xs text-[#011936]/70">{format(day, 'MMM d')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_1fr]">
          {/* Time labels */}
          <div className="divide-y divide-[#C2EABD]">
            {hours.map((hour) => (
              <div key={hour} className="h-12 p-1">
                <span className="text-xs text-[#011936]/70">
                  {format(new Date().setHours(hour), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="grid grid-cols-7 divide-x divide-[#C2EABD]">
            {weekDays.map((day) => (
              <div key={day.toString()} className="divide-y divide-[#C2EABD]">
                {hours.map((hour) => {
                  const hourEvents = getHourEvents(day, hour);
                  return (
                    <div
                      key={hour}
                      className="h-12 p-1 hover:bg-[#C2EABD]/5 cursor-pointer"
                      onClick={() => onTimeSlotClick(day, hour)}
                    >
                      {hourEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs p-1 rounded truncate",
                            `bg-${event.color}-100 text-${event.color}-900`
                          )}
                          title={event.title}
                        >
                          {event.title}
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