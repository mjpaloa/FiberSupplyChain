# 🔐 Automatic Token Refresh System

## Overview

This application implements an **automatic token refresh system** that prevents users from being logged out unexpectedly. The system monitors user activity and automatically refreshes authentication tokens before they expire.

## 🎯 Key Features

### 1. **40-Minute Inactivity Timeout**
- Session expires after **40 minutes of no user activity**
- Activity includes: clicks, keyboard input, scrolling, touch events
- Automatic logout when timeout is reached

### 2. **Automatic Token Refresh**
- Tokens refresh automatically **5 minutes before expiry**
- Happens transparently in the background
- No interruption to user experience

### 3. **Smart Activity Tracking**
- Monitors user interactions across the entire app
- Updates activity timestamp on every interaction
- Checks session validity every minute

### 4. **Seamless API Integration**
- All API calls automatically check token validity
- Retry logic for 401 Unauthorized errors
- Single centralized API client for consistency

---

## 📁 File Structure

```
frontend/src/utils/
├── authToken.ts      # Token management & activity tracking
├── apiClient.ts      # API wrapper with auto-refresh
```

---

## 🔧 Core Components

### 1. `authToken.ts` - Token Management

**Key Functions:**

```typescript
// Save tokens after login
saveAuthTokens(accessToken, refreshToken)

// Get current token
getAuthToken()

// Check if user is authenticated
isAuthenticated()

// Update activity timestamp (called on user interaction)
updateActivity()

// Check session inactivity
isSessionInactive() // Returns true after 40 mins

// Refresh token from backend
refreshAccessToken()

// Check and refresh if needed
checkAndRefreshToken()

// Initialize activity tracking (called once in App.tsx)
initActivityTracking()

// Logout and clear all data
clearAuthData()
```

**Configuration:**

```typescript
const INACTIVITY_TIMEOUT = 40 * 60 * 1000; // 40 minutes
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 mins before expiry
```

---

### 2. `apiClient.ts` - API Wrapper

**Key Functions:**

```typescript
// Main fetch with auto-refresh
apiFetch(endpoint, options)

// Convenience methods
apiGet(endpoint, options)
apiPost(endpoint, data, options)
apiPut(endpoint, data, options)
apiDelete(endpoint, options)
apiPatch(endpoint, data, options)
```

**How It Works:**

1. **Before Request**: Checks if token needs refresh
2. **Make Request**: Sends with fresh token
3. **On 401 Error**: Attempts refresh and retries once
4. **On Failure**: Redirects to login page

---

## 🚀 Usage Guide

### ✅ **CORRECT Usage (Use This)**

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiClient';

// GET request
const response = await apiGet('/api/mao/farmers');
const data = await response.json();

// POST request
const response = await apiPost('/api/mao/farmers/123/verify');

// PUT request
const response = await apiPut('/api/mao/farmers/123', formData);

// DELETE request
const response = await apiDelete('/api/mao/farmers/123');

// With data
const response = await apiPost('/api/mao/farmers/123/reject', { 
  reason: 'Invalid documents' 
});
```

### ❌ **WRONG Usage (Don't Use This)**

```typescript
// ❌ Direct fetch (no auto-refresh)
const token = localStorage.getItem('accessToken');
const response = await fetch('http://localhost:3001/api/mao/farmers', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ❌ Manual token handling
const token = getAuthToken();
fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
```

---

## 🔄 How Token Refresh Works

### Flow Diagram

```
User Activity → Update Activity Timestamp
                       ↓
              Check Token Expiry
                       ↓
         ┌─────────────┴─────────────┐
         ↓                           ↓
   Token OK                  Token Expiring Soon
         ↓                           ↓
   Continue                   Refresh Token
                                     ↓
                           ┌─────────┴─────────┐
                           ↓                   ↓
                       Success             Failure
                           ↓                   ↓
                    Save New Token      Redirect to Login
```

### Step-by-Step Process

1. **User Performs Action** (click, type, scroll)
   - Activity timestamp updated
   - Token validity checked

2. **Token Check** (every API call)
   - Is session inactive? → Logout
   - Is token expiring soon? → Refresh
   - Is token expired? → Logout

3. **Token Refresh** (if needed)
   - Call `/api/auth/refresh` endpoint
   - Backend validates refresh token
   - New access token received
   - New refresh token received (optional)
   - Tokens saved to localStorage

4. **Session Expiry** (after 40 mins inactivity)
   - Background timer detects inactivity
   - User redirected to login
   - All auth data cleared

---

## 🎯 Implementation in Components

### Example: UserManagement Component

```typescript
import { apiGet, apiPost, apiPut } from '../../utils/apiClient';

// Fetch users (auto-refresh handled)
const fetchUsers = async () => {
  const response = await apiGet('/api/mao/farmers');
  const data = await response.json();
  setUsers(data);
};

// Verify user (auto-refresh handled)
const handleVerify = async (userId: string) => {
  const response = await apiPost(`/api/mao/farmers/${userId}/verify`);
  if (response.ok) {
    alert('User verified!');
    fetchUsers();
  }
};

// Update user (auto-refresh handled)
const handleUpdate = async () => {
  const response = await apiPut(`/api/mao/farmers/${userId}`, formData);
  if (response.ok) {
    alert('Updated!');
  }
};
```

---

## 🏃 Getting Started

### 1. Initialize Activity Tracking (Done in App.tsx)

```typescript
import { initActivityTracking } from './utils/authToken';

useEffect(() => {
  initActivityTracking();
}, []);
```

### 2. Use API Client Everywhere

**Replace all direct fetch calls with apiClient methods:**

```typescript
// Before
const response = await fetch(url, { 
  headers: { 'Authorization': `Bearer ${token}` } 
});

// After
import { apiGet } from '../../utils/apiClient';
const response = await apiGet('/api/endpoint');
```

---

## ⚙️ Backend Requirements

Your backend must implement:

### 1. **Token Refresh Endpoint**

```
POST /api/auth/refresh
Content-Type: application/json

Body:
{
  "refreshToken": "...",
  "userType": "farmer" | "buyer" | "mao" | "association"
}

Response:
{
  "data": {
    "tokens": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_refresh_token"
    }
  }
}
```

### 2. **Token Validation**

- Access tokens should expire (e.g., 1 hour)
- Refresh tokens should be long-lived (e.g., 7 days)
- JWT payload must include:
  - `exp` (expiration timestamp)
  - `userType` (user role)

---

## 🐛 Debugging

### Check Token Status

```typescript
import { 
  getAuthToken, 
  isTokenExpired, 
  isSessionInactive,
  getLastActivity 
} from './utils/authToken';

console.log('Token:', getAuthToken());
console.log('Expired:', isTokenExpired());
console.log('Inactive:', isSessionInactive());
console.log('Last Activity:', new Date(getLastActivity()));
```

### Common Issues

**Issue: Token not refreshing**
- ✅ Check: Is `initActivityTracking()` called in App.tsx?
- ✅ Check: Are you using `apiClient` methods?
- ✅ Check: Is backend `/api/auth/refresh` working?

**Issue: Session expires too quickly**
- ✅ Check: `INACTIVITY_TIMEOUT` in authToken.ts (default: 40 mins)
- ✅ Adjust: Change timeout value if needed

**Issue: 401 errors not handled**
- ✅ Check: Using `apiClient` instead of direct `fetch`?
- ✅ Check: Backend returns proper 401 status?

---

## 📊 Activity Monitoring Events

The system tracks these user interactions:

- **mousedown** - Mouse clicks
- **keydown** - Keyboard input
- **scroll** - Page scrolling
- **touchstart** - Mobile touches
- **click** - Element clicks

Each event updates the activity timestamp and triggers token refresh check.

---

## 🔒 Security Features

1. **Automatic Logout**
   - Session expires after 40 minutes of inactivity
   - No manual intervention needed

2. **Token Rotation**
   - New refresh token issued on each refresh
   - Old tokens invalidated

3. **Secure Storage**
   - Tokens stored in localStorage
   - Cleared on logout

4. **Error Handling**
   - Failed refresh redirects to login
   - Invalid tokens cleared automatically

---

## 📝 Migration Checklist

If you're updating existing code:

- [ ] Import `apiClient` in all components
- [ ] Replace `fetch` with `apiGet/apiPost/apiPut/apiDelete`
- [ ] Remove manual token retrieval (`localStorage.getItem('accessToken')`)
- [ ] Remove manual Authorization headers
- [ ] Test all API endpoints
- [ ] Verify token refresh works (wait 35+ minutes)
- [ ] Test session timeout (wait 40+ minutes of inactivity)

---

## 🎉 Benefits

✅ **No More Data Loss** - Forms don't lose data on token expiry  
✅ **Better UX** - Seamless token refresh in background  
✅ **Consistent Auth** - All API calls use same method  
✅ **Automatic Logout** - Sessions expire after inactivity  
✅ **Less Code** - No manual token handling needed  

---

## 📞 Support

For issues or questions:
1. Check console logs (prefixed with ✅ ❌ ⚠️)
2. Verify backend refresh endpoint
3. Check token expiration times
4. Review activity tracking initialization

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Status**: ✅ Production Ready
