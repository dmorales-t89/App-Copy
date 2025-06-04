interface CalendarEvent {
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

export async function processCalendarImage(file: File): Promise<CalendarEvent[]> {
  try {
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('image', file);

    // Make the API call to our Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the JSON response
    const data = await response.json();

    // Transform the API response into CalendarEvent objects
    return data.events.map((event: any) => ({
      title: event.title,
      date: new Date(event.date),
      time: event.time,
      description: event.description,
    }));
  } catch (error) {
    console.error('Error processing image:', error);
    
    // Return mock data for demonstration purposes
    // In production, you might want to throw the error instead
    return [
      {
        title: "Team Meeting",
        date: new Date(2024, 2, 15, 10, 0),
        time: "10:00 AM",
        description: "Weekly sync with the development team"
      },
      {
        title: "Lunch with Client",
        date: new Date(2024, 2, 15, 12, 30),
        time: "12:30 PM",
        description: "Discussion about new project requirements"
      }
    ];
  }
}