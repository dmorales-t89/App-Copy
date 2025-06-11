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
import { CalendarIcon, Clock, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HexColorPicker } from 'react-colorful';

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
  groupId: string;
  color: string;
}

interface EventFormProps {
  initialDate: Date;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
}

export function EventForm({ initialDate, onSubmit, onCancel }: EventFormProps) {
  const form = useForm<EventFormData>({
    defaultValues: {
      title: '',
      description: '',
      startDate: initialDate,
      endDate: initialDate,
      isAllDay: false,
      startTime: format(initialDate, 'h:mm a'),
      endTime: format(addHours(initialDate, 1), 'h:mm a'),
      color: '#C2EABD',
    },
  });

  // Update form when initialDate changes
  useEffect(() => {
    form.setValue('startDate', initialDate);
    form.setValue('endDate', initialDate);
    form.setValue('startTime', format(initialDate, 'h:mm a'));
    form.setValue('endTime', format(addHours(initialDate, 1), 'h:mm a'));
  }, [initialDate, form]);

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const date = new Date();
        date.setHours(hour, minute);
        options.push(format(date, 'h:mm a'));
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const predefinedColors = [
    '#C2EABD', // Mint
    '#FFB5B5', // Soft Red
    '#B5D8FF', // Soft Blue
    '#FFE4B5', // Peach
    '#E6B5FF', // Lavender
    '#B5FFE9', // Aqua
    '#FFD700', // Gold
    '#98FB98', // Pale Green
  ];

  const handleSubmit = form.handleSubmit((data) => {
    // Parse times and combine with dates
    const startDateTime = parse(data.startTime, 'h:mm a', data.startDate);
    const endDateTime = parse(data.endTime, 'h:mm a', data.endDate);

    const finalData = {
      ...data,
      startDate: startDateTime,
      endDate: endDateTime,
    };

    onSubmit(finalData);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4 w-[350px] px-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#011936] font-medium">Title</FormLabel>
              <FormControl>
                <Input {...field} className="border-[#C2EABD] text-[#011936] placeholder:text-[#011936]/50" />
              </FormControl>
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
                        "justify-start border-[#C2EABD] text-[#011936] w-[180px]",
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-[#C2EABD] text-[#011936] w-[120px]"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {form.watch("startTime")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start" side="right">
                      <ScrollArea className="h-[200px]">
                        <div className="p-1">
                          {timeOptions.map((time) => (
                            <Button
                              key={time}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start font-normal",
                                form.watch("startTime") === time && "bg-[#C2EABD]/20"
                              )}
                              onClick={() => {
                                form.setValue("startTime", time);
                                const startTime = parse(time, 'h:mm a', new Date());
                                const endTime = parse(form.getValues('endTime'), 'h:mm a', new Date());
                                if (endTime <= startTime) {
                                  form.setValue('endTime', format(addHours(startTime, 1), 'h:mm a'));
                                }
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
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
                        "justify-start border-[#C2EABD] text-[#011936] w-[180px]",
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-[#C2EABD] text-[#011936] w-[120px]"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {form.watch("endTime")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start" side="right">
                      <ScrollArea className="h-[200px]">
                        <div className="p-1">
                          {timeOptions
                            .filter(time => {
                              if (!isSameDay(form.getValues('startDate'), form.getValues('endDate'))) {
                                return true;
                              }
                              const startTime = parse(form.getValues('startTime'), 'h:mm a', new Date());
                              const currentTime = parse(time, 'h:mm a', new Date());
                              return currentTime > startTime;
                            })
                            .map((time) => (
                              <Button
                                key={time}
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start font-normal",
                                  form.watch("endTime") === time && "bg-[#C2EABD]/20"
                                )}
                                onClick={() => form.setValue("endTime", time)}
                              >
                                {time}
                              </Button>
                            ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

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
                  placeholder="Add any additional details..."
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
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
            Create Event
          </Button>
        </div>
      </form>
    </Form>
  );
} 