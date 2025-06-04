import { NextResponse } from 'next/server';

interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  description?: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    // Convert the file to base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // Call Hugging Face API with a better model for document understanding
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/donut-base",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: base64Image,
          parameters: {
            task: "question-answering",
            question: "Extract the following information: event title, date, time, and description. Format as JSON.",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Parse the generated text to extract structured information
    let extractedText = result[0]?.generated_text || "";
    
    // Use regex to find potential dates and times
    const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b/gi;
    const timeRegex = /\b(?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:am|pm)\b/gi;
    
    const dates = extractedText.match(dateRegex) || [];
    const times = extractedText.match(timeRegex) || [];
    
    // Extract title (assume it's the first line or before the first date/time)
    const titleMatch = extractedText.split(/\n|,|\./)[0];
    
    const events: CalendarEvent[] = [{
      title: titleMatch || "Untitled Event",
      date: dates[0] || new Date().toISOString().split('T')[0],
      time: times[0] || undefined,
      description: extractedText.replace(titleMatch, '').trim() || undefined
    }];

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}