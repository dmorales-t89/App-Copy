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

async function uploadImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result); // Keep the full data URL for API
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
    
    // Call our API endpoint using OpenRouter
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