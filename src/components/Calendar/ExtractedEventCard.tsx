'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addHours, set } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, MapPin, FileText, Check, X, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExtractedEvent {
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  description?: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
}

interface ExtractedEventCardProps {
  event: ExtractedEvent;
  groups: Group[];
  onConfirm: (eventData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    startTime: string;
    endTime: string;
    color: string;
    groupId: string;
  }) => void;
  onDiscard: () => void;
  className?: string;
}

// Helper function to validate and parse time
const parseTimeString = (timeStr: string): string | null => {
  if (!timeStr) return null;
  
  try {
    // Try to parse various time formats
    const timeFormats = [
      /^(\d{1,2}):(\d{2})$/,           // HH:MM or H:MM
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i, // HH:MM AM/PM
      /^(\d{1,2})\s*(AM|PM)$/i,        // H AM/PM
    ];
    
    for (const format of timeFormats) {
      const match = timeStr.trim().match(format);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const period = match[3] || match[2]; // For formats with AM/PM
        
        // Convert to 24-hour format if needed
        if (period && period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period && period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
        
        // Validate hours and minutes
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }
    
    // Try parsing as a Date object
    const testDate = new Date(`2000-01-01T${timeStr}`);
    if (!isNaN(testDate.getTime())) {
      return format(testDate, 'HH:mm');
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse time string:', timeStr, error);
    return null;
  }
};

// Helper function to safely add hours to a time string
const safeAddHours = (timeStr: string, hoursToAdd: number): string => {
  try {
    const parsedTime = parseTimeString(timeStr);
    if (!parsedTime) {
      // Fallback to current time + hours
      return format(addHours(new Date(), hoursToAdd), 'HH:mm');
    }
    
    const testDate = new Date(`2000-01-01T${parsedTime}`);
    if (isNaN(testDate.getTime())) {
      return format(addHours(new Date(), hoursToAdd), 'HH:mm');
    }
    
    return format(addHours(testDate, hoursToAdd), 'HH:mm');
  } catch (error) {
    console.warn('Failed to add hours to time:', timeStr, error);
    return format(addHours(new Date(), hoursToAdd), 'HH:mm');
  }
};

// Helper function to generate a meaningful event title if none exists
const generateEventTitle = (event: ExtractedEvent): string => {
  if (event.title && event.title.trim() && event.title.toLowerCase() !== 'event') {
    return event.title;
  }
  
  // Generate a title based on description or date
  if (event.description) {
    const words = event.description.split(' ').slice(0, 3);
    return words.join(' ') + (event.description.split(' ').length > 3 ? '...' : '');
  }
  
  // Generate based on date and time
  const dateStr = format(event.date, 'MMM d');
  const timeStr = event.startTime ? ` at ${event.startTime}` : '';
  return `Event on ${dateStr}${timeStr}`;
};

export function ExtractedEventCard({ 
  event, 
  groups, 
  onConfirm, 
  onDiscard, 
  className 
}: ExtractedEventCardProps) {
  const [title, setTitle] = useState(generateEventTitle(event));
  const [description, setDescription] = useState(event.description || '');
  const [selectedDate, setSelectedDate] = useState(event.date);
  const [isAllDay, setIsAllDay] = useState(!event.startTime);
  
  // Safely parse the initial time values using startTime and endTime
  const initialStartTime = event.startTime ? parseTimeString(event.startTime) || '09:00' : '09:00';
  const initialEndTime = event.endTime ? parseTimeString(event.endTime) || safeAddHours(event.startTime || '09:00', 1) : safeAddHours(event.startTime || '09:00', 1);
  
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '1');
  const [selectedColor, setSelectedColor] = useState(groups[0]?.color || '#AEC6CF');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);

  const predefinedColors = [
    '#AEC6CF', // Pastel Blue
    '#77DD77', // Pastel Green
    '#FF6961', // Pastel Red/Coral
    '#B39EB5', // Pastel Purple
    '#FDFD96', // Pastel Yellow
    '#FFB347', // Pastel Orange
    '#CFCFC4', // Pastel Grey
    '#F49AC2', // Pastel Pink
  ];

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const timeDate = new Date(`2000-01-01T${time24}`);
        const time12 = format(timeDate, 'h:mma').toLowerCase();
        options.push({ value: time24, label: time12 });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleConfirm = () => {
    let startDateTime = selectedDate;
    let endDateTime = selectedDate;

    if (!isAllDay) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      startDateTime = set(selectedDate, { hours: startHour, minutes: startMinute });
      endDateTime = set(selectedDate, { hours: endHour, minutes: endMinute });
    }

    onConfirm({
      title,
      description,
      startDate: startDateTime,
      endDate: endDateTime,
      isAllDay,
      startTime,
      endTime,
      color: selectedColor,
      groupId: selectedGroupId,
    });
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setSelectedColor(group.color);
    }
  };

  const handleCustomColorChange = (color: string) => {
    setSelectedColor(color);
    // Add to custom colors if not already present
    if (!customColors.includes(color) && !predefinedColors.includes(color)) {
      setCustomColors(prev => [...prev, color].slice(-3)); // Keep only last 3 custom colors
    }
  };

  // Get display value for time selects
  const getTimeDisplayValue = (timeValue: string) => {
    if (!timeValue) return '';
    const option = timeOptions.find(opt => opt.value === timeValue);
    return option ? option.label : timeValue;
  };

  // Get selected group for display
  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  // Combine predefined and custom colors
  const allColors = [...predefinedColors, ...customColors];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
    >
      <Card className="p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm font-medium text-[#011936]">Extracted Event</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="text-gray-400 hover:text-red-500 p-1 border border-transparent hover:border-red-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Event Details Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-[#011936] mb-1 block">
              Event Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="border-2 border-gray-300 focus:border-[#1a73e8] focus:ring-[#1a73e8] text-[#011936]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-[#011936] mb-1 block">
              Date
            </label>
            <div className="flex items-center space-x-2 p-3 border-2 border-gray-300 rounded-md bg-gray-50">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-[#011936] font-medium">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between p-3 border-2 border-gray-300 rounded-md bg-gray-50">
            <span className="text-sm font-medium text-[#011936]">All day</span>
            <Switch
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
              className="data-[state=checked]:bg-[#1a73e8]"
            />
          </div>

          {/* Time Selection */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[#011936] mb-1 block">
                  Start Time
                </label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-[#1a73e8] h-auto py-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-[#011936] font-medium">
                        {getTimeDisplayValue(startTime) || 'Select time'}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] z-[9999] bg-white border border-gray-200 shadow-lg">
                    <ScrollArea className="h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem 
                          key={time.value} 
                          value={time.value} 
                          className="hover:bg-gray-50 text-[#011936] cursor-pointer"
                        >
                          {time.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#011936] mb-1 block">
                  End Time
                </label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-[#1a73e8] h-auto py-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-[#011936] font-medium">
                        {getTimeDisplayValue(endTime) || 'Select time'}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] z-[9999] bg-white border border-gray-200 shadow-lg">
                    <ScrollArea className="h-[200px]">
                      {timeOptions
                        .filter(time => {
                          const startTimeDate = new Date(`2000-01-01T${startTime}`);
                          const currentTimeDate = new Date(`2000-01-01T${time.value}`);
                          return currentTimeDate > startTimeDate;
                        })
                        .map((time) => (
                          <SelectItem 
                            key={time.value} 
                            value={time.value} 
                            className="hover:bg-gray-50 text-[#011936] cursor-pointer"
                          >
                            {time.label}
                          </SelectItem>
                        ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Calendar Selection */}
          <div>
            <label className="text-sm font-medium text-[#011936] mb-1 block">
              Calendar
            </label>
            <Select value={selectedGroupId} onValueChange={handleGroupChange}>
              <SelectTrigger className="border-2 border-gray-300 focus:border-[#1a73e8] h-auto py-3">
                {selectedGroup ? (
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: selectedGroup.color }}
                    />
                    <span className="text-[#011936] font-medium">{selectedGroup.name}</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select a calendar" />
                )}
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                {groups.map((group) => (
                  <SelectItem 
                    key={group.id} 
                    value={group.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-[#011936]">{group.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-sm font-medium text-[#011936] mb-1 block">
              Choose Color
            </label>
            <div className="space-y-3">
              {/* Predefined Colors */}
              <div className="flex flex-wrap gap-2 p-3 border-2 border-gray-300 rounded-md bg-gray-50">
                {allColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded-full transition-all border-2",
                      selectedColor === color 
                        ? "border-gray-600 scale-110 shadow-md" 
                        : "border-gray-300 hover:scale-105 hover:border-gray-400"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              
              {/* Custom Color Picker Toggle */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full justify-start border-2 border-gray-300 hover:border-[#1a73e8] h-auto py-3"
              >
                <Palette className="h-4 w-4 mr-2" />
                <span className="text-[#011936] font-medium">Custom Color</span>
                <div 
                  className="w-4 h-4 rounded-full ml-auto border border-gray-300" 
                  style={{ backgroundColor: selectedColor }}
                />
              </Button>
              
              {/* Color Picker */}
              {showColorPicker && (
                <div className="p-4 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                  <HexColorPicker 
                    color={selectedColor} 
                    onChange={handleCustomColorChange}
                    style={{ width: '100%', height: '150px' }}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-[#011936] font-medium">Selected:</span>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300" 
                      style={{ backgroundColor: selectedColor }}
                    />
                    <span className="text-sm font-mono text-[#011936] font-medium">{selectedColor}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-[#011936] mb-1 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="border-2 border-gray-300 focus:border-[#1a73e8] focus:ring-[#1a73e8] resize-none text-[#011936]"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="border-2 border-gray-300 text-[#011936] hover:bg-gray-50 hover:border-gray-400"
          >
            Discard
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!title.trim()}
            className="bg-[#1a73e8] text-white hover:bg-[#1557b0] disabled:opacity-50 border-2 border-[#1a73e8] hover:border-[#1557b0]"
          >
            <Check className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}