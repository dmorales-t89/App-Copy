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
  timestamp?: string;
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
    console.log('Processing image:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File too large. Please upload an image smaller than 10MB.');
    }
    
    // Convert image to base64
    const base64Image = await uploadImageToBase64(file);
    console.log('Image converted to base64, length:', base64Image.length);
    
    // Call our API endpoint using OpenRouter
    const apiUrl = `${window.location.origin}/api/process-image`;
    console.log('Calling API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      
      // Handle specific error types
      if (response.status === 503) {
        throw new Error(errorData.details || 'Network connectivity issue. Please check your internet connection.');
      } else if (response.status === 504) {
        throw new Error(errorData.details || 'Request timeout. The AI service is taking too long.');
      } else if (response.status === 401) {
        throw new Error('API authentication failed. Please check your configuration.');
      } else if (response.status === 500) {
        throw new Error(errorData.error || 'Server error occurred while processing the image.');
      }
      
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result: APIResponse = await response.json();
    console.log('API Response received:', {
      modelUsed: result.modelUsed,
      eventsCount: result.events?.length || 0,
      timestamp: result.timestamp
    });

    if (!result.text && (!result.events || result.events.length === 0)) {
      throw new Error('No text or events were extracted from the image. Please try an image with clearer event details.');
    }

    console.log('Extracted text preview:', result.text?.substring(0, 200) + '...');
    console.log('Model used:', result.modelUsed);

    // Convert API events to CalendarEvent format
    const events: CalendarEvent[] = (result.events || []).map(event => {
      let eventDate: Date;
      
      try {
        eventDate = new Date(event.date);
        // Validate the date
        if (isNaN(eventDate.getTime())) {
          console.warn('Invalid date detected:', event.date, 'Using current date');
          eventDate = new Date();
        }
      } catch (error) {
        console.warn('Error parsing date:', event.date, 'Using current date');
        eventDate = new Date();
      }
      
      return {
        title: event.title || 'Untitled Event',
        date: eventDate,
        time: event.time,
        description: event.description
      };
    });

    console.log('Processed events:', events);

    if (events.length === 0) {
      // If no structured events were found, create a fallback event with the extracted text
      const fallbackEvent: CalendarEvent = {
        title: "Extracted Information",
        date: new Date(),
        description: result.text ? `Extracted text: ${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}` : "No events found in the image."
      };
      
      console.log('No events found, returning fallback event');
      return [fallbackEvent];
    }

    return events;
  } catch (error) {
    console.error('Error processing image:', error);
    
    // Re-throw with more context for better error handling
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('Network')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. The AI service may be busy. Please try again.');
      } else if (error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      }
      throw error;
    }
    
    throw new Error('An unexpected error occurred while processing the image.');
  }
}