import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function testNetworkConnectivity(): Promise<{ success: boolean; error?: string }> {
  try {
    // Test basic connectivity to OpenRouter
    const testResponse = await fetch('https://openrouter.ai', {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000) // 10 second timeout for connectivity test
    });
    
    return { success: true };
  } catch (error) {
    console.error('Network connectivity test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown network error'
    };
  }
}

async function callOpenRouterAPIWithRetry(base64Image: string, retryCount = 0) {
  const maxRetries = 2;
  const retryDelay = 1000 * (retryCount + 1); // Progressive delay: 1s, 2s, 3s
  
  // Test network connectivity before making the API call
  if (retryCount === 0) {
    console.log('Testing network connectivity to OpenRouter...');
    const connectivityTest = await testNetworkConnectivity();
    if (!connectivityTest.success) {
      throw new Error(`Network connectivity test failed: ${connectivityTest.error}. Please check your internet connection and firewall settings.`);
    }
    console.log('Network connectivity test passed');
  }
  
  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 90000); // 90 seconds timeout

  try {
    console.log(`Making API request to OpenRouter (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    const response = await fetch('https://openrouter.ai/opengvlab/internvl3-14b:free', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Connection': 'keep-alive',
        'User-Agent': 'PicSchedule/1.0'
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
      const errorText = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText
      });
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully received response from OpenRouter API');
    return data;
  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    
    console.error(`API call failed (attempt ${retryCount + 1}):`, error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out after 90 seconds. The AI service may be experiencing high load. Please try again.');
    }
    
    // Enhanced network error handling
    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase();
      
      // Check for various network-related errors
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('network error') ||
          errorMessage.includes('failed to fetch') ||
          errorMessage === 'terminated' ||
          errorMessage.includes('other side closed') ||
          errorMessage.includes('socket hang up') ||
          errorMessage.includes('econnreset') ||
          errorMessage.includes('enotfound') ||
          errorMessage.includes('econnrefused') ||
          errorMessage.includes('timeout')) {
        
        console.log(`Network error detected: ${error.message}`);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return callOpenRouterAPIWithRetry(base64Image, retryCount + 1);
        } else {
          // Provide detailed network troubleshooting information
          const networkErrorMessage = `
Network connection failed after ${maxRetries + 1} attempts. This indicates a connectivity issue between your server and OpenRouter's API.

Possible causes and solutions:
1. Internet connectivity: Ensure your server has internet access
2. Firewall/Proxy: Check if outgoing HTTPS connections to openrouter.ai are blocked
3. DNS resolution: Verify that openrouter.ai can be resolved
4. Service availability: OpenRouter's API may be temporarily unavailable

Original error: ${error.message}

To troubleshoot:
- Test connectivity: curl https://openrouter.ai
- Check DNS: nslookup openrouter.ai
- Verify firewall settings for outgoing HTTPS (port 443)
          `.trim();
          
          throw new Error(networkErrorMessage);
        }
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

    const apiToken = process.env.OPENROUTER_API_KEY;
    
    console.log('=== Analyze Image API Debug Info ===');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- API key exists:', !!apiToken);
    console.log('- API key length:', apiToken ? apiToken.length : 0);
    console.log('- User ID:', user.id);
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

    console.log('Processing image with OpenRouter API...');

    // Call OpenRouter API with enhanced error handling
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

    return NextResponse.json({ 
      events,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== Error analyzing image ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error) {
      // Check for network connectivity issues
      if (error.message.includes('Network connectivity test failed')) {
        return NextResponse.json(
          { 
            error: 'Network connectivity issue',
            details: error.message,
            troubleshooting: {
              step1: 'Check your internet connection',
              step2: 'Verify firewall settings allow HTTPS connections to openrouter.ai',
              step3: 'If behind a corporate network, check proxy settings',
              step4: 'Test connectivity: curl https://openrouter.ai',
              step5: 'Restart your development server'
            }
          },
          { status: 503 }
        );
      }

      // Check for detailed network error messages
      if (error.message.includes('Network connection failed after')) {
        return NextResponse.json(
          { 
            error: 'Network connection failed',
            details: error.message,
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
            }
          },
          { status: 503 }
        );
      }

      // Check for timeout errors
      if (error.message.includes('timed out')) {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            details: error.message,
            suggestion: 'The AI service is taking longer than expected. Please try again.'
          },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        troubleshooting: 'If this error persists, please check the server logs and verify your network connectivity.'
      },
      { status: 500 }
    );
  }
}