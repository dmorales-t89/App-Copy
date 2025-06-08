import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  description?: string;
}

function parseDonutOutput(text: string): CalendarEvent[] {
  // Split the text into lines and try to extract event information
  const lines = text.split('\n').filter(line => line.trim());
  const events: CalendarEvent[] = [];
  let currentEvent: Partial<CalendarEvent> = {};

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();
    
    // Try to identify different parts of the event
    if (trimmedLine.includes('title:') || trimmedLine.includes('event:')) {
      // If we have a previous event with at least title and date, save it
      if (currentEvent.title && currentEvent.date) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = {
        title: line.split(':')[1]?.trim() || 'Untitled Event'
      };
    } else if (trimmedLine.includes('date:') || /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(trimmedLine)) {
      // Look for date patterns
      const dateMatch = line.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);
      if (dateMatch) {
        currentEvent.date = new Date(dateMatch[0]).toISOString();
      }
    } else if (trimmedLine.includes('time:') || /\d{1,2}:\d{2}/.test(trimmedLine)) {
      // Look for time patterns
      const timeMatch = line.match(/\d{1,2}:\d{2}/);
      if (timeMatch) {
        currentEvent.time = timeMatch[0];
      }
    } else if (trimmedLine.includes('description:') || trimmedLine.includes('details:')) {
      currentEvent.description = line.split(':')[1]?.trim();
    } else if (currentEvent.title && !currentEvent.description) {
      // If we have a title but no description, treat this line as description
      currentEvent.description = line.trim();
    }
  }

  // Don't forget to add the last event if it exists
  if (currentEvent.title && currentEvent.date) {
    events.push(currentEvent as CalendarEvent);
  }

  // If no events were parsed, create a single event with the entire text as description
  if (events.length === 0) {
    events.push({
      title: "Extracted Event",
      date: new Date().toISOString(),
      description: text.trim()
    });
  }

  return events;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const formData = await req.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    // Convert the file to base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    // Call Hugging Face API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/naver-clova-ix/donut-base-finetuned-cord-v2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("HUGGINGFACE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: base64Image,
          parameters: {
            task: "document_parsing",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const extractedText = result[0]?.generated_text;

    if (!extractedText) {
      throw new Error("No text was extracted from the image");
    }

    // Parse the extracted text into calendar events
    const events = parseDonutOutput(extractedText);

    return new Response(
      JSON.stringify({ events, rawText: extractedText }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        events: [
          {
            title: "Demo Event 1",
            date: new Date().toISOString(),
            time: "10:00 AM",
            description: "This is a demo event since image processing failed"
          }
        ]
      }),
      {
        status: error.message.includes("Hugging Face API error") ? 500 : 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});