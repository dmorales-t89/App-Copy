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

    return new Response(
      JSON.stringify({ events }),
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});