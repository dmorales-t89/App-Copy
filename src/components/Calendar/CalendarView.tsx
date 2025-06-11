import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/calendar';

interface CalendarViewProps {
  currentDate: Date;
  events: Event[];
  onAddEvent: (date: Date) => void;
  visibleGroups: string[];
  groups: Array<{ id: string; name: string; color: string }>;
}

export function CalendarView({ currentDate, events, onAddEvent, visibleGroups, groups }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
    });
  };

  return (
    <div className="h-full grid grid-cols-7 grid-rows-[auto_1fr] gap-px bg-[#C2EABD]/20">
      {/* Week day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div
          key={day}
          className="p-2 text-center text-sm font-medium text-[#011936] bg-white"
        >
          {day}
        </div>
      ))}

      {/* Calendar days */}
      {days.map((day, dayIdx) => {
        const dayEvents = getDayEvents(day);
        const isCurrentMonth = isSameMonth(day, currentDate);

        return (
          <div
            key={day.toString()}
            className={cn(
              "min-h-[120px] p-2 bg-white border-t border-[#C2EABD]/20",
              !isCurrentMonth && "opacity-50"
            )}
            onClick={() => onAddEvent(day)}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrentMonth ? "text-[#011936]" : "text-[#011936]/50"
                )}
              >
                {format(day, 'd')}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              {dayEvents.map((event) => (
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
          </div>
        );
      })}
    </div>
  );
} 