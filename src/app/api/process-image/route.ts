import { NextResponse } from 'next/server';
import { safeFetch, testConnectivity } from '@/lib/safeFetch';

interface CalendarEvent {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  isValidDate: boolean;
}

export const dynamic = 'force-dynamic';

const LLM_PROMPT = `
You are an intelligent event extraction AI.

Extract only actual events from this image of a schedule. Ignore date range labels or separators like 'June 01 - 07', 'June 08 - 14', etc. Follow these rules:

OUTPUT FORMAT:
Return a JSON array of objects using this structure:
[
  {
    "title": "Event 1",
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM AM/PM",
    "end_time": "HH:MM AM/PM",
    "description": ""
  }
]

RULES:

1) Only include real scheduled events — ignore headers like "June 08 - 14", "June 15 - 21", or any date range separators.
2) If no event title is shown in the image, use a generic name like "Event 1", "Event 2", etc.
3) Parse the date from the weekday + number (e.g., "Mon 9" = June 9, 2025). Use the correct full date in YYYY-MM-DD format.
4) Extract start and end times shown (e.g., "2:00 PM–7:30 PM" = start_time: "2:00 PM", end_time: "7:30 PM").
5) If only one time exists, use it as start_time and leave end_time empty.
6) If no time is listed, leave both time fields blank.

ONLY RETURN JSON. No extra text or explanation.
If no events are found, return: []
`;

async function testNetworkConnectivity(): Promise<{ success: boolean; error?: string }> {
  console.log('Testing network connectivity to OpenRouter...');
  
  const result = await testConnectivity('https://openrouter.ai', 5000);
  
  if (!result.connected) {
    console.error('Network connectivity test failed:', result.error);
  } else {
    console.log('Network connectivity test passed');
  }
  
  return {
    success: result.connected,
    error: result.error,
  };
}

async function callOpenRouterAPI(base64Image: string, prompt: string, apiToken: string, retryCount = 0) {
  console.log('API Token length:', apiToken ? apiToken.length : 0);
  console.log('API Token starts with:', apiToken ? apiToken.substring(0, 10) + '...' : 'undefined');
  
  const maxRetries = 1; // Reduced retries to fail faster
  
  // Test network connectivity before making the API call
  if (retryCount === 0) {
    const connectivityTest = await testNetworkConnectivity();
    if (!connectivityTest.success) {
      throw new Error(`NETWORK_UNAVAILABLE: ${connectivityTest.error}`);
    }
  }

  try {
    console.log(`Making API request to OpenRouter (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    const result = await safeFetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://picschedule.app',
          'X-Title': 'PicSchedule',
          'Connection': 'keep-alive',
          'User-Agent': 'PicSchedule/1.0'
        },
        body: JSON.stringify({
          model: 'qwen/qwen2.5-vl-72b-instruct:free',
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
        timeout: 30000, // 30 seconds timeout
        retries: maxRetries - retryCount,
        logErrors: true,
      }
    );

    if (!result.success) {
      console.error('OpenRouter API error:', {
        status: result.status,
        error: result.error
      });

      if (result.status === 401) {
        throw new Error('UNAUTHORIZED - Invalid OpenRouter API key. Please check your API key is valid and has sufficient credits.');
      }

      if (result.status === 404) {
        throw new Error('MODEL_NOT_FOUND - qwen/qwen2.5-vl-72b-instruct:free model not available');
      }

      if (result.status === 503) {
        throw new Error('MODEL_LOADING - Model is currently loading, please try again');
      }

      if (result.isNetworkError) {
        throw new Error(`NETWORK_ERROR: ${result.error}`);
      }

      if (result.isTimeout) {
        throw new Error('REQUEST_TIMEOUT: Request timed out after 30 seconds. The AI service may be experiencing high load.');
      }

      throw new Error(`OpenRouter API error: ${result.status} - ${result.error}`);
    }

    if (!result.data.choices || !result.data.choices[0] || !result.data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    console.log('Successfully received response from OpenRouter API');
    return result.data.choices[0].message.content;
  } catch (error) {
    console.error(`API call failed (attempt ${retryCount + 1}):`, error);
    
    if (error instanceof Error) {
      // Check for network-related errors and retry if appropriate
      if ((error.message.includes('NETWORK_ERROR') || error.message.includes('REQUEST_TIMEOUT')) && retryCount < maxRetries) {
        const retryDelay = 2000; // Fixed 2 second delay
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return callOpenRouterAPI(base64Image, prompt, apiToken, retryCount + 1);
      }
    }
    
    // Re-throw the error for final handling
    throw error;
  }
}

function createFallbackEvent(imageFileName?: string): CalendarEvent[] {
  return [{
    title: 'Manual Event Entry Required',
    date: new Date().toISOString(),
    description: `AI image analysis is currently unavailable due to network connectivity issues. Please manually create your event.${imageFileName ? ` Image: ${imageFileName}` : ''}`,
    isValidDate: true
  }];
}

function convertTo24Hour(time12: string): string {
  try {
    const time = time12.trim().toLowerCase();
    const [timePart, period] = time.split(/\s*(am|pm)\s*/);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'pm' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'am' && hours === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Failed to convert time to 24-hour format:', time12, error);
    return time12;
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
      
      // Convert times to 24-hour format for backend storage
      let startTime = event.start_time || event.startTime;
      let endTime = event.end_time || event.endTime;
      
      // Convert to 24-hour format if they exist
      if (startTime) {
        startTime = convertTo24Hour(startTime);
      }
      if (endTime) {
        endTime = convertTo24Hour(endTime);
      }
      
      // If we have a start time but no end time, auto-calculate end time as +1 hour
      if (startTime && !endTime) {
        try {
          const startDate = new Date(`2000-01-01T${startTime}`);
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
            endTime = endDate.toTimeString().slice(0, 5); // Format as HH:mm
          }
        } catch (error) {
          console.warn('Failed to calculate end time:', error);
          endTime = undefined;
        }
      }
      
      // Improve title fallback
      const title = event.title?.trim() || `Event on ${event.date || 'unknown date'}`;
      
      return {
        title,
        date: event.date,
        startTime: startTime,
        endTime: endTime,
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

  const [year, month, day] = dateStr.split('-').map(Number);

  // Validate that all parts are numbers and in valid ranges
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Construct the date in local time (month is 0-based in JavaScript)
  const localDate = new Date(year, month - 1, day);

  // Double check it's a valid date
  if (isNaN(localDate.getTime())) return null;

  return localDate;
}

function truncateText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function POST(request: Request) {
  try {
    const apiToken = process.env.OPENROUTER_API_KEY;
    
    console.log('=== Image Processing API Debug Info ===');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- API key exists:', !!apiToken);
    console.log('- API key length:', apiToken ? apiToken.length : 0);
    console.log('- Timestamp:', new Date().toISOString());
    
    if (!apiToken) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error - OpenRouter API key not found',
          details: 'Please ensure OPENROUTER_API_KEY is set in your .env.local file. Check the README.md for setup instructions.',
          troubleshooting: {
            step1: 'Verify .env.local file exists in project root',
            step2: 'Ensure OPENROUTER_API_KEY=your-key-here is set',
            step3: 'Restart the development server after adding the key'
          }
        },
        { status: 500 }
      );
    }

    if (!apiToken.startsWith('sk-or-v1-')) {
      console.error('Invalid API key format - should start with sk-or-v1-');
      return NextResponse.json(
        { 
          error: 'Invalid API key format',
          details: 'OpenRouter API key should start with sk-or-v1-. Please check your API key from the OpenRouter dashboard.'
        },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { base64Image, fileName } = data;

    if (!validateBase64Image(base64Image)) {
      return NextResponse.json(
        { error: 'Invalid or malformed image data' },
        { status: 400 }
      );
    }

    console.log('Processing image with OpenRouter qwen/qwen2.5-vl-72b-instruct:free model...');

    try {
      // Call OpenRouter API with enhanced error handling
      const llmResponse = await callOpenRouterAPI(base64Image, LLM_PROMPT, apiToken);
      console.log('LLM Response received successfully');

      // Extract events from LLM response
      console.log('Raw LLM response:\n', llmResponse);

      const events = extractEventsFromLLMResponse(llmResponse);
      console.log('Extracted events:', events.length);

      // Filter out events with no valid dates if needed
      const validEvents = events.filter(event => event.isValidDate);

      return NextResponse.json({
        text: llmResponse,
        events: validEvents,
        allEvents: events, // Include all events (even with invalid dates) for debugging
        modelUsed: 'qwen/qwen2.5-vl-72b-instruct:free (OpenRouter)',
        timestamp: new Date().toISOString(),
        fallbackUsed: false
      });
    } catch (aiError) {
      console.error('AI processing failed, providing fallback:', aiError);
      
      // Check if it's a network-related error
      if (aiError instanceof Error && 
          (aiError.message.includes('NETWORK_UNAVAILABLE') || 
           aiError.message.includes('NETWORK_ERROR') ||
           aiError.message.includes('REQUEST_TIMEOUT'))) {
        
        // Return fallback event instead of failing completely
        const fallbackEvents = createFallbackEvent(fileName);
        
        return NextResponse.json({
          text: 'AI analysis unavailable due to network connectivity issues.',
          events: fallbackEvents,
          allEvents: fallbackEvents,
          modelUsed: 'Fallback (Network Issue)',
          timestamp: new Date().toISOString(),
          fallbackUsed: true,
          fallbackReason: 'Network connectivity issue with AI service'
        });
      }
      
      // Re-throw non-network errors
      throw aiError;
    }
  } catch (error) {
    console.error('=== Error processing image ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error) {
      // Check for network connectivity issues
      if (error.message.includes('NETWORK_UNAVAILABLE')) {
        return NextResponse.json(
          { 
            error: 'Network connectivity issue',
            details: 'Cannot connect to AI service. This may be due to network restrictions in your environment.',
            troubleshooting: {
              step1: 'Check your internet connection',
              step2: 'Verify firewall settings allow HTTPS connections to openrouter.ai',
              step3: 'If behind a corporate network, check proxy settings',
              step4: 'Test connectivity: curl https://openrouter.ai',
              step5: 'Restart your development server'
            },
            suggestion: 'You can still create events manually while we work on resolving the connectivity issue.'
          },
          { status: 503 }
        );
      }

      // Check for detailed network error messages
      if (error.message.includes('NETWORK_ERROR')) {
        return NextResponse.json(
          { 
            error: 'Network connection failed',
            details: 'Unable to reach AI service after multiple attempts.',
            troubleshooting: {
              immediate: 'The server cannot reach OpenRouter\'s API',
              causes: [
                'Internet connectivity issues',
                'Firewall blocking HTTPS connections',
                'DNS resolution problems',
                'OpenRouter service temporarily unavailable'
              ],
              solutions: [
                'Check internet connection',
                'Test: curl https://openrouter.ai',
                'Verify firewall allows port 443 outbound',
                'Check OpenRouter status page',
                'Restart development server'
              ]
            },
            suggestion: 'Manual event creation is still available.'
          },
          { status: 503 }
        );
      }

      // Check for timeout errors
      if (error.message.includes('REQUEST_TIMEOUT')) {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            details: 'AI service is taking too long to respond.',
            suggestion: 'The AI service may be experiencing high load. Please try again or create events manually.'
          },
          { status: 504 }
        );
      }

      // Check for API key related errors
      if (error.message.includes('UNAUTHORIZED')) {
        return NextResponse.json(
          { 
            error: 'API Authentication Failed',
            details: error.message,
            troubleshooting: {
              step1: 'Verify your OpenRouter API key is correct',
              step2: 'Check if your API key has sufficient credits',
              step3: 'Ensure the key is properly set in .env.local'
            }
          },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        troubleshooting: 'If this error persists, please check the server logs and verify your network connectivity.',
        suggestion: 'You can still create events manually while we investigate this issue.'
      },
      { status: 500 }
    );
  }
}