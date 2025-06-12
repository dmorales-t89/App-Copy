import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function callOpenRouterAPIWithRetry(base64Image: string, retryCount = 0) {
  const maxRetries = 2;
  const retryDelay = 1000 * (retryCount + 1); // Progressive delay: 1s, 2s, 3s
  
  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 90000); // Increased to 90 seconds for better stability

  try {
    const response = await fetch('https://openrouter.ai/opengvlab/internvl3-14b:free', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Connection': 'keep-alive', // Help maintain connection stability
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
    return data;
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out after 90 seconds. The AI service may be experiencing high load. Please try again.');
    }
    
    // Handle network-related errors with retry logic
    if (error instanceof TypeError && (
      error.message === 'fetch failed' || 
      error.message === 'terminated' ||
      error.message.includes('other side closed') ||
      error.message.includes('socket hang up') ||
      error.message.includes('ECONNRESET')
    )) {
      console.log(`Network error occurred (attempt ${retryCount + 1}/${maxRetries + 1}):`, error.message);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return callOpenRouterAPIWithRetry(base64Image, retryCount + 1);
      } else {
        throw new Error(`Network connection failed after ${maxRetries + 1} attempts. The AI service may be temporarily unavailable or experiencing high load. Please try again in a few minutes.`);
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

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

    // Call OpenRouter API with retry logic
    const data = await callOpenRouterAPIWithRetry(base64Image);

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
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Enhanced error handling for network issues
    if (error instanceof Error) {
      // Check for network-related fetch errors
      if (error.message.includes('Network connection failed after') || 
          error.message === 'fetch failed' ||
          error.message === 'terminated' ||
          error.message.includes('other side closed') ||
          error.message.includes('socket hang up') ||
          error.message.includes('ECONNRESET')) {
        return NextResponse.json(
          { 
            error: 'Network connection failed',
            details: error.message.includes('after') ? error.message : 'Unable to connect to the image analysis service. The connection was unexpectedly terminated. This may be due to network issues, service overload, or temporary unavailability. Please try again in a few minutes.'
          },
          { status: 503 }
        );
      }

      // Check for timeout errors
      if (error.message.includes('timed out')) {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            details: error.message
          },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}