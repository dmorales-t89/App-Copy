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
    return event.color || groups.find(g => g.id === event.groupId)?.color || '#AEC6CF';
  };

  const formatEventTime = (event: Event) => {
    if (!event.startTime) return '';
    try {
      return format(new Date(`2000-01-01T${event.startTime}`), 'h:mm a');
    } catch {
      return event.startTime;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
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
                "border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors last:border-r-0 group",
                !isCurrentMonth && "bg-gray-50/50",
                "flex flex-col min-h-[120px] relative"
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
                    className="relative group/event"
                  >
                    <div
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                      style={{ 
                        backgroundColor: getEventColor(event), 
                        color: '#ffffff'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="font-medium leading-tight">
                        {event.startTime && (
                          <span className="font-medium mr-1">
                            {formatEventTime(event)}
                          </span>
                        )}
                        {event.title}
                      </div>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 text-white text-xs rounded p-2 shadow-lg opacity-0 group-hover/event:opacity-100 transition-opacity pointer-events-none min-w-[200px]">
                      <div className="font-medium">{event.title}</div>
                      {event.startTime && event.endTime && (
                        <div className="text-gray-300">
                          {formatEventTime(event)} - {format(new Date(`2000-01-01T${event.endTime}`), 'h:mm a')}
                        </div>
                      )}
                      {event.description && (
                        <div className="text-gray-300 mt-1">{event.description}</div>
                      )}
                      <div className="text-gray-400 text-xs mt-1">
                        {groups.find(g => g.id === event.groupId)?.name || 'Calendar'}
                      </div>
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-600 font-medium">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
              
              {/* Hover indicator for adding events */}
              <div className="absolute inset-0 border-2 border-[#C2EABD] rounded opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
}