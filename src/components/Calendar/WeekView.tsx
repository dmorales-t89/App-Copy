import React from 'react';
import { format, addDays, startOfWeek, parseISO, isSameDay, parse } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Event } from '@/types/calendar';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: Event) => void;
  onEventDragStart?: (eventId: string) => void;
  onEventDragEnd?: () => void;
  onEventDrop?: (newDate: Date, newHour?: number) => void;
  onDragOver?: (date: Date, hour?: number) => void;
  onDragLeave?: () => void;
  draggedEventId?: string | null;
  dropTargetDate?: Date | null;
  dropTargetHour?: number | null;
}

export function WeekView({ 
  currentDate, 
  events, 
  onTimeSlotClick, 
  onEventClick,
  onEventDragStart,
  onEventDragEnd,
  onEventDrop,
  onDragOver,
  onDragLeave,
  draggedEventId,
  dropTargetDate,
  dropTargetHour
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Generate hours from 6 AM to 5 AM (next day) - 24 hour cycle starting at 6 AM
  const hours = Array.from({ length: 24 }, (_, i) => (i + 6) % 24);

  const getHourEvents = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      if (!isSameDay(eventDate, date)) return false;
      
      if (!event.startTime) return hour === 6; // All-day events show at 6 AM
      
      try {
        // Parse HH:mm format
        const parsed = parse(event.startTime, 'HH:mm', new Date());
        const eventHour = parsed.getHours();
        return eventHour === hour;
      } catch {
        return false;
      }
    });
  };

  const getEventColor = (event: Event) => {
    return event.color || '#AEC6CF';
  };

  const formatHourLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const formatEventTime = (time: string) => {
    try {
      // Parse HH:mm format and convert to AM/PM
      const parsed = parse(time, 'HH:mm', new Date());
      return format(parsed, 'h:mm a');
    } catch {
      return time;
    }
  };

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', eventId);
    onEventDragStart?.(eventId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    onEventDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(date, hour);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave?.();
  };

  const handleDrop = (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (eventId && onEventDrop) {
      onEventDrop(date, hour);
    }
  };

  const isDropTarget = (date: Date, hour: number) => {
    return dropTargetDate && 
           isSameDay(dropTargetDate, date) && 
           dropTargetHour === hour;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Single Grid Container for entire calendar */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Row */}
        <div className="grid grid-cols-8 sticky top-0 z-10 bg-white border-b border-gray-200">
          {/* Empty corner cell */}
          <div className="bg-gray-50 border-r border-gray-200 min-w-[80px]"></div>
          
          {/* Day headers */}
          {weekDays.map((day, index) => (
            <div
              key={day.toString()}
              className={cn(
                "p-3 text-center bg-gray-50 border-r border-gray-200 min-h-[80px] flex flex-col justify-center",
                index === 6 && "border-r-0" // Remove border from last column
              )}
            >
              <div className="text-sm font-medium text-gray-700">{format(day, 'EEE')}</div>
              <div className={cn(
                "text-lg font-semibold mt-1 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                isSameDay(day, new Date()) ? "bg-[#C2EABD] text-[#011936]" : "text-gray-900"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time Rows - Each hour is a single grid row */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-t border-gray-200 h-16">
            {/* Time label column */}
            <div className="bg-gray-50 border-r border-gray-200 p-2 flex items-start justify-end min-w-[80px]">
              <span className="text-xs text-gray-600 font-medium pr-2">
                {formatHourLabel(hour)}
              </span>
            </div>
            
            {/* Day columns for this hour */}
            {weekDays.map((day, dayIndex) => {
              const hourEvents = getHourEvents(day, hour);
              const isTarget = isDropTarget(day, hour);
              
              return (
                <div
                  key={`${day.toString()}-${hour}`}
                  className={cn(
                    "relative cursor-pointer group transition-colors border-r border-gray-200 h-16",
                    dayIndex === 6 && "border-r-0", // Remove border from last column
                    isTarget 
                      ? "bg-blue-100 border-2 border-blue-300" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => onTimeSlotClick(day, hour)}
                  onDragOver={(e) => handleDragOver(e, day, hour)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day, hour)}
                >
                  <AnimatePresence mode="wait">
                    {hourEvents.map((event, index) => (
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
                        className="absolute inset-0 text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity shadow-sm group/event"
                        style={{ 
                          backgroundColor: getEventColor(event), 
                          color: '#ffffff',
                          // Proper centering with margin from borders
                          margin: '2px 4px',
                          zIndex: 10 + index,
                          opacity: draggedEventId === event.id ? 0.5 : 1
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.startTime && event.endTime && (
                          <div className="text-xs opacity-90 truncate">
                            {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                          </div>
                        )}
                        
                        {/* Tooltip on hover */}
                        <div className="absolute left-0 top-full mt-1 z-50 bg-gray-900 text-white text-xs rounded p-2 shadow-lg opacity-0 group-hover/event:opacity-100 transition-opacity pointer-events-none min-w-[200px]">
                          <div className="font-medium">{event.title}</div>
                          {event.startTime && event.endTime && (
                            <div className="text-gray-300">
                              {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                            </div>
                          )}
                          {(event.description || event.notes) && (
                            <div className="text-gray-300 mt-1">
                              {event.description || event.notes}
                            </div>
                          )}
                          <div className="text-gray-400 text-xs mt-1">
                            Click to edit
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {/* Hover indicator */}
                  <div className="absolute inset-0 border-2 border-[#C2EABD] rounded opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}