import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get the user from Supabase auth
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the image data from the request
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 second timeout

    try {
      // Call InternVL API
      const response = await fetch('https://openrouter.ai/opengvlab/internvl3-14b:free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: 'Extract event details from this image. Include title, date, time, and any additional notes or description. Format the response as JSON.',
        }),
        signal: controller.signal
      });

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();

      // Process and format the AI response
      // This is a placeholder - you'll need to parse the actual AI response format
      const events = [
        {
          title: data.title || 'Untitled Event',
          date: data.date || new Date().toISOString(),
          time: data.time,
          description: data.description,
        }
      ];

      return NextResponse.json({ events });
    } catch (fetchError) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds. Please try again.');
      }
      
      // Re-throw other errors
      throw fetchError;
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Check for network-related fetch errors
    if (error instanceof TypeError && error.message === 'fetch failed') {
      return NextResponse.json(
        { 
          error: 'Network connection failed',
          details: 'Unable to connect to the image analysis service. Please check your internet connection, verify your OpenRouter API key is valid, and ensure the service is available. If the problem persists, the external service may be temporarily unavailable.'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}