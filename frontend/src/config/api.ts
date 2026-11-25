// Single source of truth for the backend API server URL.
// Change DEFAULT_API_BASE_URL here to switch servers globally.
// Note: VITE_API_URL in frontend/.env (or hosting env vars) overrides this default when set.
const DEFAULT_API_BASE_URL = 'https://fibersupplychain.onrender.com';

const envApiUrl =
  typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_API_URL : undefined;

export const API_BASE_URL = (envApiUrl || DEFAULT_API_BASE_URL)
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export const API_URL = `${API_BASE_URL}/api`;

export const getApiUrl = (endpoint: string): string => {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
};
