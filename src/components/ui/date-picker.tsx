'use client';

import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function DatePicker({ 
  selectedDate, 
  onDateSelect, 
  placeholder = "Pick a date",
  disabled = false,
  className,
  label
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [isOpen, setIsOpen] = useState(false);

  // Update current month when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-900 block">
          {label}
        </label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 hover:bg-gray-100"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-8 w-8 hover:bg-gray-100"
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-0 px-4 py-2 bg-gray-50">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div
                  key={index}
                  className="h-8 flex items-center justify-center text-xs font-medium text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0 p-4">
              {days.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, selectedDate);
                const isDayToday = isToday(day);

                return (
                  <button
                    key={day.toString()}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "h-8 w-8 text-sm flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors",
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

            {/* Footer with Today button */}
            <div className="border-t border-gray-200 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTodayClick}
                className="w-full text-[#1a73e8] hover:bg-blue-50"
                type="button"
              >
                Today
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}