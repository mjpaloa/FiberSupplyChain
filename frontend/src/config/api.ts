/**
 * API Configuration
 * Centralized API URL configuration for all API calls
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get the full API URL for an endpoint
 * @param endpoint - The API endpoint (should start with /api/)
 * @returns Full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // If endpoint already includes the base URL, return as is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // If endpoint doesn't start with /, add it
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

export default API_BASE_URL;
