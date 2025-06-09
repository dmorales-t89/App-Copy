import { NextResponse } from 'next/server';

interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  description?: string;
  isValidDate: boolean;
}

export const dynamic = 'force-dynamic';

const LLM_PROMPT = `Analyze this image and extract any calendar events, appointments, or scheduled activities you can find. Look for dates, times, event titles, locations, and descriptions.

Return your response as a JSON array of events in this exact format:
[
  {
    "title": "Event title",
    "date": "YYYY-MM-DD",
    "time": "HH:MM AM/PM",
    "description": "Event description or location"
  }
]

If you find multiple events, include them all in the array. If no events are found, return an empty array [].
Only return valid JSON - no additional text or explanations.`;

async function callOpenRouterAPI(base64Image: string, prompt: string, apiToken: string) {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://picscheduler.app',
        'X-Title': 'PicScheduler',
      },
      body: JSON.stringify({
        model: 'opengvlab/internvl3-14b:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    }
  );

  // Always parse response as text first
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error('OpenRouter API error:', {
      status: response.status,
      statusText: response.statusText,
      responseBody: responseText
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED - Invalid OpenRouter API key');
    }

    if (response.status === 404) {
      throw new Error('MODEL_NOT_FOUND - opengvlab/internvl3-14b:free model not available');
    }

    if (response.status === 503) {
      throw new Error('MODEL_LOADING - Model is currently loading, please try again');
    }

    throw new Error(`OpenRouter API error: ${response.status} - ${responseText}`);
  }

  // Try to parse as JSON
  try {
    const jsonResponse = JSON.parse(responseText);
    
    if (!jsonResponse.choices || !jsonResponse.choices[0] || !jsonResponse.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    return jsonResponse.choices[0].message.content;
  } catch (jsonError) {
    console.error('Failed to parse JSON response from OpenRouter:', {
      responseText: responseText,
      jsonError: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parse error'
    });
    throw new Error(`Invalid JSON response from OpenRouter: ${responseText}`);
  }
}

function extractEventsFromLLMResponse(llmResponse: string): CalendarEvent[] {
  if (!llmResponse) {
    throw new Error('Empty response from LLM');
  }

  try {
    // Try to parse the LLM response as JSON
    const events = JSON.parse(llmResponse.trim());
    
    if (!Array.isArray(events)) {
      throw new Error('LLM response is not an array');
    }

    // Map and validate each event
    return events.map((event: any) => {
      const parsedDate = parseDate(event.date);
      return {
        title: event.title || 'Untitled Event',
        date: parsedDate ? parsedDate.toISOString() : event.date,
        time: event.time,
        description: event.description,
        isValidDate: parsedDate !== null
      };
    });

  } catch (parseError) {
    console.error('Failed to parse LLM response as JSON:', parseError);
    
    // Fallback: create a single event with the raw response
    return [{
      title: 'Extracted Information',
      date: new Date().toISOString(),
      description: truncateText(llmResponse),
      isValidDate: true
    }];
  }
}

function validateBase64Image(base64Image: string): boolean {
  if (!base64Image) return false;

  // Check for valid data URL prefix
  const validPrefixRegex = /^data:image\/(jpeg|png|gif|bmp|webp);base64,/i;
  if (!validPrefixRegex.test(base64Image)) return false;

  // Check if the base64 content is present and valid
  const base64Data = base64Image.split(',')[1];
  if (!base64Data || base64Data.length === 0) return false;

  // Basic check for valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(base64Data);
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try parsing the date string
  const date = new Date(dateStr);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    // Try some common date formats
    const formats = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const testDate = new Date(match[0]);
        if (!isNaN(testDate.getTime())) {
          return testDate;
        }
      }
    }
    
    return null;
  }
  
  return date;
}

function truncateText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function POST(request: Request) {
  try {
    const apiToken = process.env.OPENROUTER_API_KEY;
    
    if (!apiToken) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - OpenRouter API key not found' },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { base64Image } = data;

    if (!validateBase64Image(base64Image)) {
      return NextResponse.json(
        { error: 'Invalid or malformed image data' },
        { status: 400 }
      );
    }

    console.log('Processing image with OpenRouter opengvlab/internvl3-14b:free model...');

    // Call OpenRouter API
    const llmResponse = await callOpenRouterAPI(base64Image, LLM_PROMPT, apiToken);
    console.log('LLM Response:', llmResponse);

    // Extract events from LLM response
    const events = extractEventsFromLLMResponse(llmResponse);
    console.log('Extracted events:', events);

    // Filter out events with no valid dates if needed
    const validEvents = events.filter(event => event.isValidDate);

    return NextResponse.json({
      text: llmResponse,
      events: validEvents,
      allEvents: events, // Include all events (even with invalid dates) for debugging
      modelUsed: 'opengvlab/internvl3-14b:free'
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}