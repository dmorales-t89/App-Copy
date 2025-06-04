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

    // Call Hugging Face API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/naver-clova-ix/donut-base-finetuned-cord-v2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
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
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Parse the result to extract calendar events
    // This is a simplified example - you'll need to adjust based on actual Donut output
    const events: CalendarEvent[] = [{
      title: "Extracted Event",
      date: new Date().toISOString(),
      time: "12:00",
      description: result[0]?.generated_text || "No text extracted",
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