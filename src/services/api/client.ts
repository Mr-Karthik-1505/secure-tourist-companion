// API Client with error handling and auth support

import { API_CONFIG, getApiUrl } from './config';
import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

// Main fetch wrapper - uses Supabase JWT for authentication
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, isFormData = false } = options;
  
  const url = getApiUrl(endpoint);
  
  // Get current session token for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  const requestHeaders: Record<string, string> = {
    ...headers,
  };
  
  if (session?.access_token) {
    requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    return {
      success: false,
      error: {
        code: 'AUTH_MISSING',
        message: 'Authentication required. Please sign in before making requests.',
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
          error: { code: 'TIMEOUT', message: 'Request timed out' },
        };
      }
      
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to connect to the server. Please check your connection.' },
      };
    }
    
    return {
      success: false,
      error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' },
    };
  }
}
