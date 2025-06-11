import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface EventCreationFormProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onSubmit: (eventData: {
    title: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    color: string;
    imageUrl?: string;
    groupId: string;
    notes?: string;
  }) => void;
  groups: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export function EventCreationForm({ selectedDate, onDateChange, onSubmit, groups }: EventCreationFormProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      date: selectedDate,
      startTime,
      endTime,
      color: groups.find(g => g.id === groupId)?.color.replace('bg-', '') || 'emerald',
      imageUrl,
      groupId,
      notes
    });
    // Reset form
    setTitle('');
    setStartTime('');
    setEndTime('');
    setNotes('');
    setImageUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-[#011936]">Event Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event title"
          className="border-[#C2EABD] text-[#011936]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[#011936]">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal border-[#C2EABD] text-[#011936] hover:bg-[#C2EABD]/10",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-[#011936]">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border-[#C2EABD] text-[#011936]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime" className="text-[#011936]">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border-[#C2EABD] text-[#011936]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[#011936]">Calendar</Label>
        <div className="grid grid-cols-2 gap-2">
          {groups.map((group) => (
            <Button
              key={group.id}
              type="button"
              variant="outline"
              className={cn(
                "justify-start border-[#C2EABD] text-[#011936] hover:bg-[#C2EABD]/10",
                groupId === group.id && "border-2 border-[#011936] bg-[#C2EABD]/5"
              )}
              onClick={() => setGroupId(group.id)}
            >
              <div className={cn("w-3 h-3 rounded-full mr-2", group.color)} />
              {group.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-[#011936]">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes..."
          className="border-[#C2EABD] text-[#011936] min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="text-[#011936]">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Enter image URL"
          className="border-[#C2EABD] text-[#011936]"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#C2EABD] text-[#011936] hover:bg-[#A3D5FF]"
      >
        Create Event
      </Button>
    </form>
  );
} 