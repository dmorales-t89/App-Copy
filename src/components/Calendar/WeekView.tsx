import React from 'react';
import { format, addDays, startOfWeek, parseISO, isSameDay, parse } from 'date-fns';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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

// ✅ Constants for enhanced event display
const HOUR_HEIGHT_PX = 64;

// ✅ Helper functions for time calculations
const timeToMinutes = (timeStr: string): number => {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  } catch {
    return 0;
  }
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// ✅ Calculate event position and size for multi-hour display
const getEventPositionAndSize = (event: Event, eventsInDay: Event[]) => {
  const startMinutes = event.startTime ? timeToMinutes(event.startTime) : 6 * 60; // Default to 6 AM
  const endMinutes = event.endTime ? timeToMinutes(event.endTime) : startMinutes + 60; // Default 1 hour
  
  // Calculate position relative to 6 AM start
  const startOffsetMinutes = Math.max(0, startMinutes - 6 * 60);
  const durationMinutes = Math.max(15, endMinutes - startMinutes); // Minimum 15 minutes
  
  const top = (startOffsetMinutes / 60) * HOUR_HEIGHT_PX;
  const height = Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT_PX); // Minimum 20px height
  
  // ✅ Fixed positioning to prevent shifting
  const left = '2px';
  const width = 'calc(100% - 4px)';
  
  return { top, height, left, width };
};

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

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
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

  // ✅ Fix: Properly typed drag event handlers using framer-motion
  const handleFramerDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, eventId: string) => {
    onEventDragStart?.(eventId);
  };

  const handleFramerDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, eventId: string) => {
    onEventDragEnd?.();
  };

  // ✅ Standard DOM drag handlers for time slots (unchanged)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(date, hour);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragLeave?.();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: Date, hour: number) => {
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
        {/* Header Row - Part of the same grid */}
        <div className="grid grid-cols-8 sticky top-0 z-10 bg-white border-b border-gray-200">
          {/* Empty corner cell */}
          <div className="bg-gray-50 border-r border-gray-200"></div>
          
          {/* Day headers */}
          {weekDays.map((day, index) => (
            <div
              key={day.toString()}
              className={cn(
                "p-3 text-center bg-gray-50 border-r border-gray-200 relative",
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
              
              {/* ✅ Day column container for absolutely positioned events */}
              <div className="absolute inset-0 top-16 pointer-events-none">
                <div className="relative h-full">
                  {getDayEvents(day).map((event) => {
                    const { top, height, left, width } = getEventPositionAndSize(event, getDayEvents(day));
                    
                    return (
                      <motion.div
                        key={event.id}
                        className="absolute text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity shadow-sm relative group/event pointer-events-auto"
                        style={{ 
                          backgroundColor: getEventColor(event), 
                          color: '#ffffff',
                          top: `${top}px`,
                          height: `${height}px`,
                          left,
                          width,
                          zIndex: draggedEventId === event.id ? 20 : 10,
                          opacity: draggedEventId === event.id ? 0.5 : 1
                        }}
                        drag
                        dragSnapToOrigin={true}
                        onDragStart={(e, info) => handleFramerDragStart(e, info, event.id)}
                        onDragEnd={(e, info) => handleFramerDragEnd(e, info, event.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        initial={{ scale: 0.7, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: draggedEventId === event.id ? 0.5 : 1, y: 0 }}
                        exit={{ scale: 1.3, opacity: 0, y: -10 }}
                        transition={{ 
                          type: "spring", 
                          damping: 12, 
                          stiffness: 400,
                          mass: 0.8,
                          duration: 0.4
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.startTime && event.endTime && height > 40 && (
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
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Time Rows - Each hour is a single grid row */}
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-t border-gray-200" style={{ height: `${HOUR_HEIGHT_PX}px` }}>
            {/* Time label column */}
            <div className="bg-gray-50 border-r border-gray-200 p-2 flex items-start justify-end">
              <span className="text-xs text-gray-600 font-medium pr-2">
                {formatHourLabel(hour)}
              </span>
            </div>
            
            {/* Day columns for this hour */}
            {weekDays.map((day, dayIndex) => {
              const isTarget = isDropTarget(day, hour);
              
              return (
                <div
                  key={`${day.toString()}-${hour}`}
                  className={cn(
                    "relative cursor-pointer group transition-colors border-r border-gray-200",
                    dayIndex === 6 && "border-r-0", // Remove border from last column
                    isTarget 
                      ? "bg-blue-100 border-2 border-blue-300" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => onTimeSlotClick(day, hour)}
                  onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, day, hour)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e, day, hour)}
                >
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