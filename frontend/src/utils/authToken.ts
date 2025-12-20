/**
 * Centralized Token Management
 * Single source of truth for all authentication tokens
 */

import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = 'token';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const USER_TYPE_KEY = 'userType';
const LAST_ACTIVITY_KEY = 'lastActivity';

// Token will expire after 40 minutes of inactivity
const INACTIVITY_TIMEOUT = 40 * 60 * 1000; // 40 minutes in milliseconds
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if 5 minutes before expiry

/**
 * Save authentication tokens to localStorage
 */
export const saveAuthTokens = (accessToken: string, refreshToken: string) => {
  try {
    // Save both 'token' and 'accessToken' for compatibility
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    console.log('✅ Tokens saved successfully');
  } catch (error) {
    console.error('❌ Error saving tokens:', error);
  }
};

/**
 * Get the current authentication token
 * Returns the token or null if not found
 */
export const getAuthToken = (): string | null => {
  try {
    // Try 'token' first, fallback to 'accessToken'
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
};

/**
 * Get refresh token
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Error getting refresh token:', error);
    return null;
  }
};

/**
 * Save user data to localStorage
 */
export const saveUserData = (user: any, userType: string) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(USER_TYPE_KEY, userType);
    console.log('✅ User data saved successfully');
  } catch (error) {
    console.error('❌ Error saving user data:', error);
  }
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): any | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    return null;
  }
};

/**
 * Get user type
 */
export const getUserType = (): string | null => {
  try {
    return localStorage.getItem(USER_TYPE_KEY);
  } catch (error) {
    console.error('❌ Error getting user type:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Clear all authentication data (logout)
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_TYPE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    console.log('✅ Auth data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getAuthToken();
  if (!token) {
    console.warn('⚠️ No auth token found');
    return {};
  }
  return {
    Authorization: `Bearer ${token}`
  };
};

/**
 * Check if token is expired (basic check)
 * Returns true if token appears to be expired
 */
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;

  try {
    // Decode JWT token (basic decode, not verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true; // Assume expired if we can't check
  }
};

/**
 * Complete login - save all auth data
 */
export const completeLogin = (
  accessToken: string,
  refreshToken: string,
  user: any,
  userType: string
) => {
  saveAuthTokens(accessToken, refreshToken);
  saveUserData(user, userType);
  updateActivity(); // Initialize activity timestamp on login
  console.log('✅ Login completed successfully');
};

/**
 * Complete logout - clear all auth data
 */
export const completeLogout = () => {
  clearAuthData();
  console.log('✅ Logout completed successfully');
};

/**
 * Validate stored authentication data
 * Ensures token and userType are consistent
 */
export const validateAuthData = (): { isValid: boolean; userType: string | null } => {
  try {
    const token = getAuthToken();
    const userType = getUserType();
    const userData = getUserData();

    if (!token || !userType || !userData) {
      console.warn('⚠️ Incomplete auth data found, clearing...');
      clearAuthData();
      return { isValid: false, userType: null };
    }

    // Decode token to verify userType matches
    const payload = JSON.parse(atob(token.split('.')[1]));
    const tokenUserType = payload.userType;

    if (tokenUserType !== userType) {
      console.error('❌ Token userType mismatch! Token:', tokenUserType, 'Stored:', userType);
      clearAuthData();
      return { isValid: false, userType: null };
    }

    // Check if token is expired
    if (isTokenExpired()) {
      console.warn('⚠️ Token expired, clearing auth data...');
      clearAuthData();
      return { isValid: false, userType: null };
    }

    console.log('✅ Auth data validation successful:', { userType: tokenUserType });
    return { isValid: true, userType: tokenUserType };
  } catch (error) {
    console.error('❌ Error validating auth data:', error);
    clearAuthData();
    return { isValid: false, userType: null };
  }
};

/**
 * Update last activity timestamp
 */
export const updateActivity = () => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (error) {
    console.error('❌ Error updating activity:', error);
  }
};

/**
 * Get last activity timestamp
 */
export const getLastActivity = (): number => {
  try {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    return lastActivity ? parseInt(lastActivity) : 0;
  } catch (error) {
    console.error('❌ Error getting last activity:', error);
    return 0;
  }
};

/**
 * Check if session is inactive (no activity for 40 minutes)
 */
export const isSessionInactive = (): boolean => {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;
  
  const timeSinceLastActivity = Date.now() - lastActivity;
  return timeSinceLastActivity > INACTIVITY_TIMEOUT;
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = getRefreshToken();
    const userType = getUserType();
    
    if (!refreshToken || !userType) {
      console.warn('⚠️ No refresh token or user type found');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken, userType }),
    });

    if (!response.ok) {
      console.error('❌ Token refresh failed');
      return false;
    }

    const data = await response.json();
    
    if (data.data?.tokens) {
      saveAuthTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      updateActivity();
      console.log('✅ Token refreshed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return false;
  }
};

/**
 * Check and refresh token if needed
 * Should be called on every user activity
 */
export const checkAndRefreshToken = async (): Promise<boolean> => {
  try {
    // Check if session is inactive
    if (isSessionInactive()) {
      console.warn('⚠️ Session inactive for 40+ minutes, logging out...');
      clearAuthData();
      window.location.href = '/';
      return false;
    }

    // Update activity timestamp
    updateActivity();

    // Check if token needs refresh
    const token = getAuthToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // Refresh if token expires in less than 5 minutes
      if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        console.log('⏰ Token expiring soon, refreshing...');
        return await refreshAccessToken();
      }
    } catch (error) {
      console.error('❌ Error checking token expiry:', error);
    }

    return true;
  } catch (error) {
    console.error('❌ Error in checkAndRefreshToken:', error);
    return false;
  }
};

/**
 * Initialize activity tracking
 * Call this once when app loads
 */
export const initActivityTracking = () => {
  // Update activity on any user interaction
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, () => {
      if (isAuthenticated()) {
        checkAndRefreshToken();
      }
    }, { passive: true });
  });

  // Check session every minute
  setInterval(() => {
    if (isAuthenticated() && isSessionInactive()) {
      console.warn('⚠️ Session expired due to inactivity');
      clearAuthData();
      window.location.href = '/';
    }
  }, 60000); // Check every minute
};

export default {
  saveAuthTokens,
  getAuthToken,
  getRefreshToken,
  saveUserData,
  getUserData,
  getUserType,
  isAuthenticated,
  clearAuthData,
  getAuthHeader,
  isTokenExpired,
  completeLogin,
  completeLogout,
  updateActivity,
  checkAndRefreshToken,
  refreshAccessToken,
  initActivityTracking,
  isSessionInactive
};
