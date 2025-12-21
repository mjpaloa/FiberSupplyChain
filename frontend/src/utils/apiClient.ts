/**
 * API Client with Automatic Token Refresh
 * All API calls should use this instead of direct fetch
 */

import { checkAndRefreshToken, getAuthToken, clearAuthData } from './authToken';

const API_URL = import.meta.env.VITE_API_URL || 'https://easyabaca-api.vercel.app';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Enhanced fetch with automatic token refresh
 * Use this for all authenticated API calls
 */
export const apiFetch = async (endpoint: string, options: FetchOptions = {}): Promise<Response> => {
  const { skipAuth, ...fetchOptions } = options;

  // For authenticated requests, check and refresh token if needed
  if (!skipAuth) {
    const tokenValid = await checkAndRefreshToken();
    
    if (!tokenValid) {
      console.error('❌ Token refresh failed, redirecting to login');
      clearAuthData();
      window.location.href = '/';
      throw new Error('Authentication failed');
    }
  }

  // Get fresh token after refresh
  const token = getAuthToken();
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add existing headers from options
  if (fetchOptions.headers) {
    Object.entries(fetchOptions.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  // Add authorization header if not skipped
  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Build full URL
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized - token might be invalid
    if (response.status === 401 && !skipAuth) {
      console.warn('⚠️ Received 401, attempting token refresh...');
      
      // Try to refresh token one more time
      const refreshed = await checkAndRefreshToken();
      
      if (refreshed) {
        // Retry the request with new token
        const newToken = getAuthToken();
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`
        };
        
        return await fetch(url, {
          ...fetchOptions,
          headers: retryHeaders,
        });
      } else {
        // Refresh failed, logout
        console.error('❌ Token refresh failed on 401, logging out');
        clearAuthData();
        window.location.href = '/';
        throw new Error('Session expired');
      }
    }

    return response;
  } catch (error) {
    console.error('❌ API fetch error:', error);
    throw error;
  }
};

/**
 * Convenience methods for common HTTP verbs
 */
export const apiGet = (endpoint: string, options?: FetchOptions) => 
  apiFetch(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint: string, data?: any, options?: FetchOptions) => 
  apiFetch(endpoint, { 
    ...options, 
    method: 'POST', 
    body: data ? JSON.stringify(data) : undefined 
  });

export const apiPut = (endpoint: string, data?: any, options?: FetchOptions) => 
  apiFetch(endpoint, { 
    ...options, 
    method: 'PUT', 
    body: data ? JSON.stringify(data) : undefined 
  });

export const apiDelete = (endpoint: string, options?: FetchOptions) => 
  apiFetch(endpoint, { ...options, method: 'DELETE' });

export const apiPatch = (endpoint: string, data?: any, options?: FetchOptions) => 
  apiFetch(endpoint, { 
    ...options, 
    method: 'PATCH', 
    body: data ? JSON.stringify(data) : undefined 
  });

export default {
  fetch: apiFetch,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch,
};
