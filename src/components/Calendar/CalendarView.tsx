import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/calendar';

interface CalendarViewProps {
  currentDate: Date;
  events: Event[];
  onAddEvent: (date: Date) => void;
  onEventClick: (event: Event) => void;
  groups: Array<{ id: string; name: string; color: string }>;
}

export function CalendarView({ currentDate, events, onAddEvent, onEventClick, groups }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getEventColor = (event: Event) => {
    return event.color || groups.find(g => g.id === event.groupId)?.color || '#3B82F6';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-550"> {/*Editeddddddddddd was 200 */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - Fixed height for uniform boxes */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((day, dayIdx) => {
          const dayEvents = getDayEvents(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, currentDate);

          return (
            <div
              key={day.toString()}
              className={cn(
                "border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors last:border-r-0",
                !isCurrentMonth && "bg-gray-50/50",
                "flex flex-col min-h-[120px]"
              )}
              onClick={() => onAddEvent(day)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                    isCurrentMonth ? "text-gray-900" : "text-gray-400",
                    // Today gets light blue background, always takes priority
                    isDayToday && "bg-[#A3D5FF] text-[#011936] font-bold",
                    // Selected date gets light green background, but only if it's not today
                    isSelected && !isDayToday && "bg-[#C2EABD] text-[#011936] font-bold"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="flex-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
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
                    {event.startTime && (
                      <span className="font-medium mr-1">
                        {format(new Date(`2000-01-01T${event.startTime}`), 'h:mm a')}
                      </span>
                    )}
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-600 font-medium">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}