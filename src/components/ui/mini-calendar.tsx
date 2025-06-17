'use client';

import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function MiniCalendar({ selectedDate, onDateSelect, className }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  return (
    <div className={cn("bg-white rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-medium text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-6 w-6 hover:bg-[#C2EABD]/30"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-6 w-6 hover:bg-[#C2EABD]/30"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Today Button */}
      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTodayClick}
          className="w-full text-xs bg-gradient-to-r from-[#C2EABD]/20 to-[#A3D5FF]/20 hover:from-[#C2EABD]/30 hover:to-[#A3D5FF]/30 text-[#011936] border border-[#C2EABD]/30"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Today
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-0 px-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div
            key={index}
            className="h-6 flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0 px-3 pb-3">
        {days.map((day, dayIdx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);

          return (
            <button
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-6 w-6 text-xs flex items-center justify-center rounded-full hover:bg-[#C2EABD]/30 transition-colors",
                !isCurrentMonth && "text-gray-300",
                isCurrentMonth && "text-gray-900",
                // Today gets light blue background, always takes priority
                isDayToday && "bg-[#A3D5FF] text-[#011936] font-medium hover:bg-[#A3D5FF]/90",
                // Selected date gets light green background, but only if it's not today
                isSelected && !isDayToday && "bg-[#C2EABD] text-[#011936] font-medium hover:bg-[#C2EABD]/90"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}