import React, { useEffect } from 'react';
import { format, addHours, isBefore, isSameDay, parse, set } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Event } from '@/types/calendar';

interface Group {
  id: string;
  name: string;
  color: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  color: string;
  groupId: string;
}

interface EventFormProps {
  initialDate: Date;
  editingEvent?: Event | null;
  groups: Group[];
  onSubmit: (data: EventFormData) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function EventForm({ initialDate, editingEvent, groups, onSubmit, onDelete, onCancel }: EventFormProps) {
  const form = useForm<EventFormData>({
    defaultValues: {
      title: editingEvent?.title || '',
      description: editingEvent?.description || editingEvent?.notes || '',
      startDate: editingEvent ? new Date(editingEvent.date) : initialDate,
      endDate: editingEvent ? new Date(editingEvent.date) : initialDate,
      isAllDay: !editingEvent?.startTime,
      startTime: editingEvent?.startTime ? format(new Date(`2000-01-01T${editingEvent.startTime}`), 'HH:mm') : format(initialDate, 'HH:mm'),
      endTime: editingEvent?.endTime ? format(new Date(`2000-01-01T${editingEvent.endTime}`), 'HH:mm') : format(addHours(initialDate, 1), 'HH:mm'),
      color: editingEvent?.color || groups[0]?.color || '#3B82F6',
      groupId: editingEvent?.groupId || groups[0]?.id || '1',
    },
  });

  // Update form when initialDate or editingEvent changes
  useEffect(() => {
    if (editingEvent) {
      form.reset({
        title: editingEvent.title,
        description: editingEvent.description || editingEvent.notes || '',
        startDate: new Date(editingEvent.date),
        endDate: new Date(editingEvent.date),
        isAllDay: !editingEvent.startTime,
        startTime: editingEvent.startTime ? format(new Date(`2000-01-01T${editingEvent.startTime}`), 'HH:mm') : '09:00',
        endTime: editingEvent.endTime ? format(new Date(`2000-01-01T${editingEvent.endTime}`), 'HH:mm') : '10:00',
        color: editingEvent.color || groups[0]?.color || '#3B82F6',
        groupId: editingEvent.groupId || groups[0]?.id || '1',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        startDate: initialDate,
        endDate: initialDate,
        isAllDay: false,
        startTime: format(initialDate, 'HH:mm'),
        endTime: format(addHours(initialDate, 1), 'HH:mm'),
        color: groups[0]?.color || '#3B82F6',
        groupId: groups[0]?.id || '1',
      });
    }
  }, [initialDate, editingEvent, form, groups]);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

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

  const handleSubmit = form.handleSubmit((data) => {
    // Create proper date objects with times
    let startDateTime = data.startDate;
    let endDateTime = data.endDate;

    if (!data.isAllDay) {
      const [startHour, startMinute] = data.startTime.split(':').map(Number);
      const [endHour, endMinute] = data.endTime.split(':').map(Number);
      
      startDateTime = set(data.startDate, { hours: startHour, minutes: startMinute });
      endDateTime = set(data.endDate, { hours: endHour, minutes: endMinute });
    }

    const finalData = {
      ...data,
      startDate: startDateTime,
      endDate: endDateTime,
    };

    onSubmit(finalData);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#011936] font-medium">Title</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="border-[#C2EABD] text-[#011936] placeholder:text-[#011936]/50" 
                  placeholder="Add title"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="groupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#011936] font-medium">Calendar</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-[#C2EABD]">
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#011936] font-medium">Event Color</FormLabel>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md border-[#C2EABD]">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      field.value === color && "ring-2 ring-offset-2 ring-[#011936]"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => field.onChange(color)}
                  />
                ))}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAllDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#C2EABD] p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-[#011936] font-medium">All Day</FormLabel>
                <FormDescription className="text-[#011936]/70">
                  Event will take the entire day
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-[#C2EABD]"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div>
              <FormLabel className="text-[#011936] font-medium block mb-2">Start</FormLabel>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start border-[#C2EABD] text-[#011936] flex-1",
                        !form.watch("startDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(form.watch("startDate"), "EEE, MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="right">
                    <Calendar
                      mode="single"
                      selected={form.watch("startDate")}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue("startDate", date);
                          if (isBefore(form.getValues('endDate'), date)) {
                            form.setValue('endDate', date);
                          }
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {!form.watch("isAllDay") && (
                  <Select
                    value={form.watch("startTime")}
                    onValueChange={(value) => {
                      form.setValue("startTime", value);
                      const startTime = new Date(`2000-01-01T${value}`);
                      const endTime = new Date(`2000-01-01T${form.getValues('endTime')}`);
                      if (endTime <= startTime) {
                        const newEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                        form.setValue('endTime', format(newEndTime, 'HH:mm'));
                      }
                    }}
                  >
                    <SelectTrigger className="w-[120px] border-[#C2EABD]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <FormLabel className="text-[#011936] font-medium block mb-2">End</FormLabel>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start border-[#C2EABD] text-[#011936] flex-1",
                        !form.watch("endDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(form.watch("endDate"), "EEE, MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="right">
                    <Calendar
                      mode="single"
                      selected={form.watch("endDate")}
                      onSelect={(date) => date && form.setValue("endDate", date)}
                      disabled={(date) =>
                        date < form.getValues('startDate')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {!form.watch("isAllDay") && (
                  <Select
                    value={form.watch("endTime")}
                    onValueChange={(value) => form.setValue("endTime", value)}
                  >
                    <SelectTrigger className="w-[120px] border-[#C2EABD]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {timeOptions
                          .filter(time => {
                            if (!isSameDay(form.getValues('startDate'), form.getValues('endDate'))) {
                              return true;
                            }
                            const startTime = new Date(`2000-01-01T${form.getValues('startTime')}`);
                            const currentTime = new Date(`2000-01-01T${time}`);
                            return currentTime > startTime;
                          })
                          .map((time) => (
                            <SelectItem key={time} value={time}>
                              {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                            </SelectItem>
                          ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#011936] font-medium">Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-[100px] border-[#C2EABD] text-[#011936] placeholder:text-[#011936]/50"
                  placeholder="Add description..."
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-2 pt-4">
          <div>
            {editingEvent && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-[#C2EABD] text-[#011936] hover:bg-[#C2EABD]/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#C2EABD] text-[#011936] hover:bg-[#C2EABD]/90"
            >
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}