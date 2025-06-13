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
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const timeDate = new Date(`2000-01-01T${time24}`);
        const time12 = format(timeDate, 'h:mma').toLowerCase();
        options.push({ value: time24, label: time12 });
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
    <div className="max-w-full overflow-hidden">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-900 font-medium">Title</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="border-gray-300 text-gray-900 placeholder:text-gray-500" 
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
                <FormLabel className="text-gray-900 font-medium">Calendar</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select a calendar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[60] bg-white border border-gray-200 shadow-lg">
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
                <FormLabel className="text-gray-900 font-medium">Event Color</FormLabel>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md border-gray-300">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-6 h-6 rounded-full transition-all",
                        field.value === color && "ring-2 ring-offset-2 ring-gray-400"
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-300 p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-gray-900 font-medium">All Day</FormLabel>
                  <FormDescription className="text-gray-600">
                    Event will take the entire day
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-[#1a73e8]"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <FormLabel className="text-gray-900 font-medium block mb-2">Start</FormLabel>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start border-gray-300 text-gray-900",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "EEE, MMM d, yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                                if (isBefore(form.getValues('endDate'), date)) {
                                  form.setValue('endDate', date);
                                }
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />

                  {!form.watch("isAllDay") && (
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const startTime = new Date(`2000-01-01T${value}`);
                            const endTime = new Date(`2000-01-01T${form.getValues('endTime')}`);
                            if (endTime <= startTime) {
                              const newEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                              form.setValue('endTime', format(newEndTime, 'HH:mm'));
                            }
                          }}
                        >
                          <SelectTrigger className="border-gray-300">
                            <Clock className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="z-[70] bg-white border border-gray-200 shadow-lg max-h-[200px]">
                            <ScrollArea className="h-[200px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={time.value} value={time.value} className="hover:bg-gray-50">
                                  {time.label}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                </div>
              </div>

              <div>
                <FormLabel className="text-gray-900 font-medium block mb-2">End</FormLabel>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start border-gray-300 text-gray-900",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "EEE, MMM d, yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            disabled={(date) =>
                              date < form.getValues('startDate')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />

                  {!form.watch("isAllDay") && (
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="border-gray-300">
                            <Clock className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="z-[70] bg-white border border-gray-200 shadow-lg max-h-[200px]">
                            <ScrollArea className="h-[200px]">
                              {timeOptions
                                .filter(time => {
                                  if (!isSameDay(form.getValues('startDate'), form.getValues('endDate'))) {
                                    return true;
                                  }
                                  const startTime = new Date(`2000-01-01T${form.getValues('startTime')}`);
                                  const currentTime = new Date(`2000-01-01T${time.value}`);
                                  return currentTime > startTime;
                                })
                                .map((time) => (
                                  <SelectItem key={time.value} value={time.value} className="hover:bg-gray-50">
                                    {time.label}
                                  </SelectItem>
                                ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      )}
                    />
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
                <FormLabel className="text-gray-900 font-medium">Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="min-h-[80px] border-gray-300 text-gray-900 placeholder:text-gray-500 resize-none"
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
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1a73e8] text-white hover:bg-[#1557b0]"
              >
                {editingEvent ? 'Save' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}