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
  fallbackUsed?: boolean;
  fallbackReason?: string;
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
      body: JSON.stringify({ 
        base64Image,
        fileName: file.name 
      }),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      
      // Handle specific error types with more user-friendly messages
      if (response.status === 503) {
        // Network connectivity issues - provide helpful guidance
        throw new Error(
          'AI image analysis is currently unavailable due to network connectivity issues. ' +
          'This may be due to firewall restrictions or internet connectivity problems in your environment. ' +
          'You can still create events manually.'
        );
      } else if (response.status === 504) {
        throw new Error(
          'The AI service is taking too long to respond. This may be due to high server load. ' +
          'Please try again in a moment, or create your event manually.'
        );
      } else if (response.status === 401) {
        throw new Error(
          'AI service authentication failed. This is a configuration issue. ' +
          'Please contact support or create your event manually.'
        );
      } else if (response.status === 500) {
        throw new Error(
          'A server error occurred while processing the image. ' +
          'You can still create events manually while we investigate this issue.'
        );
      }
      
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result: APIResponse = await response.json();
    console.log('API Response received:', {
      modelUsed: result.modelUsed,
      eventsCount: result.events?.length || 0,
      timestamp: result.timestamp,
      fallbackUsed: result.fallbackUsed
    });

    // Handle fallback responses
    if (result.fallbackUsed) {
      console.log('Fallback response received:', result.fallbackReason);
      // Still process the fallback events normally
    }

    if (!result.text && (!result.events || result.events.length === 0)) {
      throw new Error(
        'No events could be extracted from the image. This could be because: ' +
        '1) The image doesn\'t contain clear event information, ' +
        '2) The text in the image is too blurry or small to read, or ' +
        '3) The AI service is temporarily unavailable. ' +
        'Please try with a clearer image or create your event manually.'
      );
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
        description: result.text ? 
          `Extracted text: ${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}` : 
          "No events found in the image. Please create your event manually with the details you can see in the image."
      };
      
      console.log('No events found, returning fallback event');
      return [fallbackEvent];
    }

    return events;
  } catch (error) {
    console.error('Error processing image:', error);
    
    // Re-throw with more context for better error handling
    if (error instanceof Error) {
      // Network-related errors - provide user-friendly messages
      if (error.message.includes('fetch failed') || 
          error.message.includes('Network') ||
          error.message.includes('connectivity')) {
        throw new Error(
          'Unable to connect to the AI image analysis service. This may be due to: ' +
          '1) Network connectivity issues, ' +
          '2) Firewall restrictions blocking external connections, or ' +
          '3) The AI service being temporarily unavailable. ' +
          'You can still create events manually by entering the event details yourself.'
        );
      } else if (error.message.includes('timeout')) {
        throw new Error(
          'The AI service is taking too long to respond, possibly due to high server load. ' +
          'Please try again in a moment, or create your event manually.'
        );
      } else if (error.message.includes('API key')) {
        throw new Error(
          'AI service configuration error. Please contact support or create your event manually.'
        );
      }
      
      // If it's already a user-friendly error message, pass it through
      if (error.message.includes('You can still create events manually') ||
          error.message.includes('create your event manually')) {
        throw error;
      }
    }
    
    throw new Error(
      'An unexpected error occurred while processing the image. ' +
      'You can still create events manually by entering the event details yourself.'
    );
  }
}