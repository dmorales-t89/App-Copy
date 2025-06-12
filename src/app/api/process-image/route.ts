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

async function callOpenRouterAPI(base64Image: string, prompt: string, apiToken: string, retryCount = 0) {
  console.log('API Token length:', apiToken ? apiToken.length : 0);
  console.log('API Token starts with:', apiToken ? apiToken.substring(0, 10) + '...' : 'undefined');
  
  const maxRetries = 2;
  const retryDelay = 1000 * (retryCount + 1); // Progressive delay: 1s, 2s, 3s
  
  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 90000); // Increased to 90 seconds for better stability

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://picschedule.app',
          'X-Title': 'PicSchedule',
          'Connection': 'keep-alive', // Help maintain connection stability
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
        signal: controller.signal
      }
    );

    // Clear timeout on successful response
    clearTimeout(timeoutId);

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText
      });

      if (response.status === 401) {
        throw new Error('UNAUTHORIZED - Invalid OpenRouter API key. Please check your API key is valid and has sufficient credits.');
      }

      if (response.status === 404) {
        throw new Error('MODEL_NOT_FOUND - opengvlab/internvl3-14b:free model not available');
      }

      if (response.status === 503) {
        throw new Error('MODEL_LOADING - Model is currently loading, please try again');
      }

      throw new Error(`OpenRouter API error: ${response.status} - ${responseText}`);
    }

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
        return callOpenRouterAPI(base64Image, prompt, apiToken, retryCount + 1);
      } else {
        throw new Error(`Network connection failed after ${maxRetries + 1} attempts. The AI service may be temporarily unavailable or experiencing high load. Please try again in a few minutes.`);
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

function extractEventsFromLLMResponse(llmResponse: string): CalendarEvent[] {
  if (!llmResponse) {
    throw new Error('Empty response from LLM');
  }

  try {
    // Clean the response - remove any markdown formatting or extra text
    let cleanResponse = llmResponse.trim();
    
    // Remove markdown code blocks if present
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    // Find JSON array in the response
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }

    const events = JSON.parse(cleanResponse);
    
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
    console.error('Raw LLM response:', llmResponse);
    
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
    
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- API key exists:', !!apiToken);
    console.log('- API key length:', apiToken ? apiToken.length : 0);
    
    if (!apiToken) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error - OpenRouter API key not found',
          details: 'Please ensure OPENROUTER_API_KEY is set in your .env.local file'
        },
        { status: 500 }
      );
    }

    if (!apiToken.startsWith('sk-or-v1-')) {
      console.error('Invalid API key format - should start with sk-or-v1-');
      return NextResponse.json(
        { 
          error: 'Invalid API key format',
          details: 'OpenRouter API key should start with sk-or-v1-'
        },
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

    // Call OpenRouter API with retry logic
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
      modelUsed: 'opengvlab/internvl3-14b:free (OpenRouter)'
    });
  } catch (error) {
    console.error('Error processing image:', error);
    
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
            details: error.message.includes('after') ? error.message : 'Unable to connect to the OpenRouter API service. The connection was unexpectedly terminated. This may be due to network issues, service overload, or temporary unavailability. Please try again in a few minutes.'
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
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}