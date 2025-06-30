import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, startOfWeek, endOfWeek, isToday, parse } from 'date-fns';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Event } from '@/types/calendar';

interface CalendarViewProps {
  currentDate: Date;
  events: Event[];
  onAddEvent: (date: Date) => void;
  onEventClick: (event: Event) => void;
  groups: Array<{ id: string; name: string; color: string }>;
  onEventDragStart?: (eventId: string) => void;
  onEventDragEnd?: () => void;
  onEventDrop?: (newDate: Date) => void;
  onDragOver?: (date: Date) => void;
  onDragLeave?: () => void;
  draggedEventId?: string | null;
  dropTargetDate?: Date | null;
}

export function CalendarView({ 
  currentDate, 
  events, 
  onAddEvent, 
  onEventClick, 
  groups,
  onEventDragStart,
  onEventDragEnd,
  onEventDrop,
  onDragOver,
  onDragLeave,
  draggedEventId,
  dropTargetDate
}: CalendarViewProps) {
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
      // Parse HH:mm format and convert to AM/PM
      const parsed = parse(event.startTime, 'HH:mm', new Date());
      return format(parsed, 'h:mm a');
    } catch {
      return event.startTime;
    }
  };

  const formatEventEndTime = (event: Event) => {
    if (!event.endTime) return '';
    try {
      // Parse HH:mm format and convert to AM/PM
      const parsed = parse(event.endTime, 'HH:mm', new Date());
      return format(parsed, 'h:mm a');
    } catch {
      return event.endTime;
    }
  };

  // ✅ Framer Motion drag handlers with proper typing and dataTransfer
  const handleFramerDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, eventId: string) => {
    // ✅ Set dataTransfer for compatibility with native drop handlers
    if (event instanceof MouseEvent && event.dataTransfer) {
      event.dataTransfer.setData('text/plain', eventId);
    }
    onEventDragStart?.(eventId);
  };

  const handleFramerDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, eventId: string) => {
    onEventDragEnd?.();
  };

  // ✅ Standard DOM drag handlers for day cells
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(date);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragLeave?.();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: Date) => {
    e.preventDefault();
    e.stopPropagation();
    const eventId = e.dataTransfer.getData('text/plain');
    if (eventId && onEventDrop) {
      onEventDrop(date);
    }
  };

  const isDropTarget = (date: Date) => {
    return dropTargetDate && isSameDay(dropTargetDate, date);
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
          const isTarget = isDropTarget(day);

          return (
            <div
              key={day.toString()}
              className={cn(
                "border-r border-b border-gray-200 p-2 cursor-pointer transition-colors last:border-r-0 group",
                !isCurrentMonth && "bg-gray-50/50",
                isTarget && "bg-blue-100 border-2 border-blue-300",
                !isTarget && "hover:bg-gray-50",
                "flex flex-col min-h-[120px] relative"
              )}
              onClick={() => onAddEvent(day)}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, day)}
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
                <AnimatePresence mode="wait">
                  {dayEvents.slice(0, 3).map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ scale: 0.7, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 1.3, opacity: 0, y: -10 }}
                      transition={{ 
                        type: "spring", 
                        damping: 12, 
                        stiffness: 400,
                        mass: 0.8,
                        duration: 0.4
                      }}
                      className="relative group/event"
                    >
                      <motion.div
                        className={cn(
                          "text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity shadow-sm",
                          draggedEventId === event.id && "opacity-50"
                        )}
                        style={{ 
                          backgroundColor: getEventColor(event), 
                          color: '#ffffff',
                          zIndex: draggedEventId === event.id ? 20 : 10
                        }}
                        drag
                        dragSnapToOrigin={true}
                        onDragStart={(e, info) => handleFramerDragStart(e, info, event.id)}
                        onDragEnd={(e, info) => handleFramerDragEnd(e, info, event.id)}
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
                      </motion.div>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 text-white text-xs rounded p-2 shadow-lg opacity-0 group-hover/event:opacity-100 transition-opacity pointer-events-none min-w-[200px]">
                        <div className="font-medium">{event.title}</div>
                        {event.startTime && event.endTime && (
                          <div className="text-gray-300">
                            {formatEventTime(event)} - {formatEventEndTime(event)}
                          </div>
                        )}
                        {(event.description || event.notes) && (
                          <div className="text-gray-300 mt-1">{event.description || event.notes}</div>
                        )}
                        <div className="text-gray-400 text-xs mt-1">
                          {groups.find(g => g.id === event.groupId)?.name || 'Calendar'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
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