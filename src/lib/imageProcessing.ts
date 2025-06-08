import { createWorker, Worker } from 'tesseract.js';

interface CalendarEvent {
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

interface APICalendarEvent {
  title: string;
  date: string;
  time?: string;
  description?: string;
  isValidDate: boolean;
}

interface APIResponse {
  text: string;
  events: APICalendarEvent[];
  allEvents: APICalendarEvent[];
  modelUsed: string;
}

function parseScheduleText(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract the month and year
  let currentMonth: string | null = null;
  let currentYear: number | null = null;
  
  for (const line of lines) {
    const monthYearMatch = line.match(/(\w+)\s+(\d{4})/);
    if (monthYearMatch) {
      currentMonth = monthYearMatch[1];
      currentYear = parseInt(monthYearMatch[2]);
      continue;
    }
  }

  if (!currentMonth || !currentYear) {
    console.error('Could not find month and year in the text');
    return [];
  }

  let currentDay: number | null = null;
  let currentEvent: Partial<CalendarEvent> = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for day of the week with number (e.g., "Mon 2" or just "2")
    const dayMatch = line.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?\s*(\d{1,2})\s*$/);
    if (dayMatch) {
      // Save previous event if exists
      if (currentEvent.title && currentEvent.date) {
        events.push(currentEvent as CalendarEvent);
      }
      
      currentDay = parseInt(dayMatch[1]);
      currentEvent = {};
      continue;
    }

    // Check for time range pattern (e.g., "2:00 PM-7:30 PM [5.50]")
    const timeRangeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)-(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*\[[\d.]+\]/i);
    if (timeRangeMatch && currentDay && currentMonth && currentYear) {
      const startTime = timeRangeMatch[1];
      const endTime = timeRangeMatch[2];
      
      // Create date object
      const dateStr = `${currentMonth} ${currentDay}, ${currentYear}`;
      const eventDate = new Date(dateStr);
      
      currentEvent = {
        title: `Work Shift: ${startTime} to ${endTime}`,
        date: eventDate,
        time: `${startTime}-${endTime}`,
        description: `Waves/Base/Lifeguard-Deep Water`
      };
      
      events.push(currentEvent as CalendarEvent);
      continue;
    }

    // Check for time off requests
    if (trimmedLine.includes('[Submitted]') && currentDay && currentMonth && currentYear) {
      const dateStr = `${currentMonth} ${currentDay}, ${currentYear}`;
      const eventDate = new Date(dateStr);
      
      // Look for the request description in the next lines
      const requestDesc = lines
        .slice(lines.indexOf(line) + 1)
        .find(l => l.includes('Request') || l.includes('Hours'));

      currentEvent = {
        title: 'Time Off Request',
        date: eventDate,
        description: requestDesc || 'Day Off Request Submitted'
      };
      
      events.push(currentEvent as CalendarEvent);
    }
  }

  return events;
}

async function uploadImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result); // Don't remove the prefix, API expects full data URL
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function processCalendarImage(file: File): Promise<CalendarEvent[]> {
  try {
    console.log('Processing image:', file.name);
    
    // Convert image to base64
    const base64Image = await uploadImageToBase64(file);
    
    // Call our secure API endpoint using the current window location
    const apiUrl = `${window.location.origin}/api/process-image`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result: APIResponse = await response.json();
    console.log('API Response:', result);

    if (!result.text) {
      throw new Error('No text was extracted from the image');
    }

    console.log('Extracted text:', result.text);
    console.log('Model used:', result.modelUsed);

    // Convert API events to CalendarEvent format
    const events: CalendarEvent[] = result.events.map(event => ({
      title: event.title,
      date: new Date(event.date),
      time: event.time,
      description: event.description
    }));

    if (events.length === 0) {
      return [{
        title: "No events found",
        date: new Date(),
        description: "Could not detect any calendar events in the image. The extracted text was: " + result.text
      }];
    }

    return events;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}