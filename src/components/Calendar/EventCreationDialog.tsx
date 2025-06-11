import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { FileUpload } from '../FileUpload';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EventCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (event: {
    title: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    color: string;
    imageUrl?: string;
    groupId: string;
    notes?: string;
  }) => void;
  selectedDate: Date;
  groups: { id: string; name: string; color: string }[];
}

interface AIEvent {
  title: string;
  date: string;
  time?: string;
  description?: string;
}

export const EventCreationDialog: React.FC<EventCreationDialogProps> = ({
  isOpen,
  onClose,
  onCreateEvent,
  selectedDate,
  groups,
}) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string>();
  const [suggestedEvents, setSuggestedEvents] = useState<AIEvent[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('manual');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateEvent({
      title,
      date: selectedDate,
      startTime,
      endTime,
      color: groups.find(g => g.id === groupId)?.color || 'emerald',
      imageUrl,
      groupId,
      notes,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setStartTime('');
    setEndTime('');
    setGroupId(groups[0]?.id || '');
    setNotes('');
    setImageUrl(undefined);
    setSuggestedEvents([]);
    setActiveTab('manual');
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsProcessingImage(true);
    try {
      // Create a temporary URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);

      // Send image to API for analysis
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const { events } = await response.json();
      setSuggestedEvents(events);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const applyAIEvent = (event: AIEvent) => {
    setTitle(event.title);
    if (event.time) setStartTime(event.time);
    if (event.description) setNotes(event.description);
    setActiveTab('manual');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Calendar</Label>
                <div className="grid grid-cols-2 gap-2">
                  {groups.map((group) => (
                    <Button
                      key={group.id}
                      type="button"
                      variant="outline"
                      className={cn(
                        "justify-start",
                        groupId === group.id && "border-2 border-black"
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              {imageUrl && (
                <div className="space-y-2">
                  <Label>Attached Image</Label>
                  <img
                    src={imageUrl}
                    alt="Event attachment"
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Create Event</Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="upload">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Schedule Image</Label>
                <FileUpload onChange={handleImageUpload} />
              </div>

              {suggestedEvents.length > 0 && (
                <div className="space-y-2">
                  <Label>Suggested Events</Label>
                  <div className="space-y-2">
                    {suggestedEvents.map((event, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => applyAIEvent(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        {event.time && (
                          <div className="text-sm text-gray-600">Time: {event.time}</div>
                        )}
                        {event.description && (
                          <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 