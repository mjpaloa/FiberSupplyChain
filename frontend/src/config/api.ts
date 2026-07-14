export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fibersupplychain.onrender.com';

export const getApiUrl = (endpoint: string): string => {
  return endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
};
