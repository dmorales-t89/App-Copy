/**
 * Safe fetch utility for handling network requests gracefully during build-time
 * Prevents build crashes from transient network errors or API unavailability
 */

export interface SafeFetchResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  isNetworkError?: boolean;
  isTimeout?: boolean;
}

export interface SafeFetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  logErrors?: boolean;
  fallbackData?: any;
}

/**
 * Safely fetch data with comprehensive error handling
 * Returns structured result instead of throwing errors
 */
export async function safeFetch<T = any>(
  url: string,
  options: RequestInit & SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    logErrors = true,
    fallbackData,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (logErrors && attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${retries} for ${url}`);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        
        if (logErrors) {
          console.warn(`⚠️ HTTP ${response.status} for ${url}: ${errorText}`);
        }

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status,
          data: fallbackData,
        };
      }

      // Try to parse JSON response
      let data: T;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        if (logErrors) {
          console.warn(`⚠️ JSON parse error for ${url}:`, parseError);
        }
        
        return {
          success: false,
          error: 'Invalid JSON response',
          status: response.status,
          data: fallbackData,
        };
      }

      if (logErrors && attempt > 0) {
        console.log(`✅ Success on retry ${attempt} for ${url}`);
      }

      return {
        success: true,
        data,
        status: response.status,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Determine error type
      const isNetworkError = lastError.name === 'TypeError' || 
                           lastError.message.includes('fetch failed') ||
                           lastError.message.includes('network') ||
                           lastError.message.includes('ENOTFOUND') ||
                           lastError.message.includes('ECONNREFUSED');
      
      const isTimeout = lastError.name === 'AbortError' || 
                       lastError.message.includes('timeout');

      if (logErrors) {
        const errorType = isTimeout ? 'TIMEOUT' : isNetworkError ? 'NETWORK' : 'UNKNOWN';
        console.warn(`❌ ${errorType} error (attempt ${attempt + 1}/${retries + 1}) for ${url}:`, lastError.message);
      }

      // Don't retry on the last attempt
      if (attempt < retries) {
        // Progressive delay: 1s, 2s, 3s...
        const delay = retryDelay * (attempt + 1);
        if (logErrors) {
          console.log(`⏳ Waiting ${delay}ms before retry...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt failed
      return {
        success: false,
        error: lastError.message,
        isNetworkError,
        isTimeout,
        data: fallbackData,
      };
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    data: fallbackData,
  };
}

/**
 * Safe fetch specifically for build-time operations
 * More conservative timeouts and better logging for CI/CD environments
 */
export async function safeFetchForBuild<T = any>(
  url: string,
  options: RequestInit & Omit<SafeFetchOptions, 'timeout' | 'retries'> = {}
): Promise<SafeFetchResult<T>> {
  return safeFetch<T>(url, {
    timeout: 15000, // Longer timeout for build environments
    retries: 1,     // Fewer retries to fail fast
    retryDelay: 2000,
    logErrors: true,
    ...options,
  });
}

/**
 * Test network connectivity to a service
 * Returns boolean for simple connectivity checks
 */
export async function testConnectivity(
  url: string,
  timeout: number = 5000
): Promise<{ connected: boolean; error?: string }> {
  try {
    const result = await safeFetch(url, {
      method: 'HEAD',
      timeout,
      retries: 0,
      logErrors: false,
    });

    return {
      connected: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}