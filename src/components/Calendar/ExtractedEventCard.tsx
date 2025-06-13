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
import { Calendar, Clock, MapPin, FileText, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractedEvent {
  title: string;
  date: Date;
  time?: string;
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

export function ExtractedEventCard({ 
  event, 
  groups, 
  onConfirm, 
  onDiscard, 
  className 
}: ExtractedEventCardProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [selectedDate, setSelectedDate] = useState(event.date);
  const [isAllDay, setIsAllDay] = useState(!event.time);
  const [startTime, setStartTime] = useState(
    event.time ? event.time : format(new Date(), 'HH:mm')
  );
  const [endTime, setEndTime] = useState(
    event.time 
      ? format(addHours(new Date(`2000-01-01T${event.time}`), 1), 'HH:mm')
      : format(addHours(new Date(), 1), 'HH:mm')
  );
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '1');
  const [selectedColor, setSelectedColor] = useState(groups[0]?.color || '#3B82F6');

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F59E0B', // Yellow
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
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
            <span className="text-sm font-medium text-gray-700">Extracted Event</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDiscard}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Event Details Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Event Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="border-gray-300"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Date
            </label>
            <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md bg-gray-50">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between p-2 border border-gray-300 rounded-md">
            <span className="text-sm font-medium text-gray-700">All day</span>
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
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Start Time
                </label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="border-gray-300">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  End Time
                </label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="border-gray-300">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions
                      .filter(time => {
                        const startTimeDate = new Date(`2000-01-01T${startTime}`);
                        const currentTimeDate = new Date(`2000-01-01T${time.value}`);
                        return currentTimeDate > startTimeDate;
                      })
                      .map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Calendar Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Calendar
            </label>
            <Select value={selectedGroupId} onValueChange={handleGroupChange}>
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                      />
                      <span>{group.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Color
            </label>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    selectedColor === color && "ring-2 ring-offset-2 ring-gray-400"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="border-gray-300 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Discard
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!title.trim()}
            className="bg-[#1a73e8] text-white hover:bg-[#1557b0]"
          >
            <Check className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}