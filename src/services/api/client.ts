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
  
  // Add auth header if API key exists
  if (apiKey) {
    requestHeaders['x-api-key'] = apiKey;
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
      return {
        success: false,
        error: data.error || {
          code: `HTTP_${response.status}`,
          message: response.statusText,
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
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message,
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
