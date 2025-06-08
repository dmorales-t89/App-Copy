import { NextResponse } from 'next/server';

interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  description?: string;
  isValidDate: boolean;
}

interface OCRModelConfig {
  modelId: string;
  name: string;
}

const OCR_MODELS: OCRModelConfig[] = [
  { modelId: 'microsoft/trocr-base-printed', name: 'Large Printed Text Model' },
  { modelId: 'microsoft/trocr-base-handwritten', name: 'Base Handwritten Text Model' }
];

export const dynamic = 'force-dynamic';

async function callHuggingFaceAPI(base64Data: string, modelConfig: OCRModelConfig, apiToken: string) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelConfig.modelId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ inputs: base64Data }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Hugging Face ${modelConfig.name} error:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });

    if (response.status === 404) {
      throw new Error('MODEL_NOT_FOUND');
    }

    if (response.status === 503) {
      throw new Error('MODEL_LOADING');
    }

    if (response.status === 500) {
      throw new Error('INTERNAL_SERVER_ERROR');
    }

    throw new Error(`${modelConfig.name} error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

function extractTextFromOCRResponse(ocrResult: any): string {
  if (!ocrResult) {
    throw new Error('Empty OCR result received');
  }

  // Handle array response
  if (Array.isArray(ocrResult)) {
    const firstResult = ocrResult[0];
    if (typeof firstResult === 'string') {
      return firstResult;
    }
    if (firstResult?.generated_text) {
      return firstResult.generated_text;
    }
    throw new Error('Invalid array response format');
  }

  // Handle object response
  if (ocrResult.generated_text) {
    return ocrResult.generated_text;
  }

  // Handle error messages in response
  if (ocrResult.error) {
    throw new Error(`Model error: ${ocrResult.error}`);
  }

  throw new Error('Unexpected OCR response format');
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
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function truncateText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function POST(request: Request) {
  try {
    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    
    if (!apiToken) {
      console.error('HUGGING_FACE_API_TOKEN is not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - API token not found' },
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

    // Remove data:image/[type];base64, prefix
    const base64Data = base64Image.split(',')[1];
    
    let extractedText = '';
    let currentModelIndex = 0;
    let success = false;

    // Try each model in sequence until one works
    while (currentModelIndex < OCR_MODELS.length && !success) {
      const currentModel = OCR_MODELS[currentModelIndex];
      console.log(`Attempting OCR with ${currentModel.name}...`);

      try {
        const ocrResult = await callHuggingFaceAPI(base64Data, currentModel, apiToken);
        extractedText = extractTextFromOCRResponse(ocrResult);
        success = true;
      } catch (error) {
        if (error instanceof Error && 
            (error.message === 'MODEL_LOADING' || 
             error.message === 'INTERNAL_SERVER_ERROR' || 
             error.message === 'MODEL_NOT_FOUND') && 
            currentModelIndex < OCR_MODELS.length - 1) {
          console.log(`${currentModel.name} failed (${error.message}), trying next model...`);
          currentModelIndex++;
        } else {
          throw error;
        }
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: 'All OCR models failed to process the image' },
        { status: 503 }
      );
    }

    console.log('Extracted text:', extractedText);

    // Process the text to identify dates and times
    const dateTimeRegex = {
      date: /(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4})|(?:\d{1,2}(?:st|nd|rd|th)? (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4})/gi,
      time: /(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)|(?:\d{1,2}\s*[AaPp][Mm])/gi
    };

    const dates = extractedText.match(dateTimeRegex.date) || [];
    const times = extractedText.match(dateTimeRegex.time) || [];

    // Create calendar events with validation
    const events: CalendarEvent[] = dates.map((dateStr: string, index: number) => {
      const parsedDate = parseDate(dateStr);
      return {
        title: `Event from image`,
        date: parsedDate ? parsedDate.toISOString() : dateStr,
        time: times[index] || undefined,
        description: truncateText(extractedText),
        isValidDate: parsedDate !== null
      };
    });

    // Filter out events with no valid dates if needed
    const validEvents = events.filter(event => event.isValidDate);

    return NextResponse.json({
      text: truncateText(extractedText),
      events: validEvents,
      allEvents: events, // Include all events (even with invalid dates) for debugging
      modelUsed: OCR_MODELS[currentModelIndex].name
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