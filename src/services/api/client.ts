// API Client with error handling and auth support

import { API_CONFIG, getApiUrl } from './config';
import type { ApiResponse } from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

// Get API key from localStorage or env (for demo)
const getApiKey = (): string | null => {
  return localStorage.getItem('kyc_api_key') || import.meta.env.VITE_API_KEY || null;
};

// Set API key
export const setApiKey = (key: string): void => {
  localStorage.setItem('kyc_api_key', key);
};

// Clear API key
export const clearApiKey = (): void => {
  localStorage.removeItem('kyc_api_key');
};

// Main fetch wrapper
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, isFormData = false } = options;
  
  const url = getApiUrl(endpoint);
  const apiKey = getApiKey();
  
  const requestHeaders: Record<string, string> = {
    ...headers,
  };
  
  // Require API key for all requests to protected endpoints
  if (apiKey) {
    requestHeaders['x-api-key'] = apiKey;
  } else {
    console.warn('[API] No API key configured. Requests to protected endpoints will likely fail.');
    return {
      success: false,
      error: {
        code: 'AUTH_MISSING',
        message: 'API key is required. Configure it via settings before making requests.',
      },
    };
  }
  
  // Add content-type for JSON (not for FormData)
  if (!isFormData && body) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      // Sanitize error responses - never expose raw server details to client
      const safeMessages: Record<number, string> = {
        400: 'Invalid request. Please check your input.',
        401: 'Authentication required.',
        403: 'You do not have permission for this action.',
        404: 'The requested resource was not found.',
        429: 'Too many requests. Please try again later.',
      };
      return {
        success: false,
        error: {
          code: response.status < 500 ? 'REQUEST_ERROR' : 'SERVER_ERROR',
          message: safeMessages[response.status] || 'An unexpected error occurred. Please try again.',
        },
      };
    }
    
    return data as ApiResponse<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out',
          },
        };
      }
      
      console.error('[API] Network error:', error.message);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your connection.',
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
    };
  }
}
