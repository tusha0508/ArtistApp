# Session Logging - Fixes Applied

## Problems Identified & Fixed

### Problem 1: "JWT Malformed" Error on GET /me
**Root Cause:** Token parsing was failing silently and throwing "malformed JWT" error
```javascript
// OLD - Would throw error if format slightly wrong
const token = req.headers.authorization?.split(" ")[1];
```

**Fix Applied:**
```javascript
// NEW - Explicitly parse Bearer token, handle edge cases
const authHeader = req.headers.authorization;
let token;
if (authHeader.startsWith("Bearer ")) {
  token = authHeader.slice(7);
} else {
  token = authHeader;
}
// Wrap JWT.verify in try-catch to catch parse errors
```

**Files Updated:**
- [src/routes/authRoutes.js](src/routes/authRoutes.js) - GET /me and GET /login-history
- [src/routes/artistAuthRoutes.js](src/routes/artistAuthRoutes.js) - POST /logout

---

### Problem 2: Device Info Showing "Unknown"
**Root Cause:** Mobile app wasn't capturing and sending device information

**Fix Applied:**

1. **Created [mobile/lib/deviceInfo.js](mobile/lib/deviceInfo.js)**
   - `getDeviceInfo()` - Collects comprehensive device data
   - `formatDeviceInfoForBackend()` - Formats for transmission
   - Uses expo-device and expo-application libraries

2. **Updated [mobile/store/authStore.jsx](mobile/store/authStore.jsx)**
   - login() now captures device info via `getDeviceInfo()`
   - Sends device info in request body
   - Stores device info in AsyncStorage for logout
   - logout() now sends device info with logout request

3. **Updated [mobile/lib/http.jsx](mobile/lib/http.jsx)**
   - Auto-adds Authorization header with stored token
   - Prevents manual header management in every screen

4. **Updated [mobile/constants/api.jsx](mobile/constants/api.jsx)**
   - Added USER_LOGOUT and ARTIST_LOGOUT endpoints

---

### Problem 3: Logout Time Not Saved in Database
**Root Cause:** Session update wasn't being triggered or saved properly

**Fix Applied:**

1. **Enhanced [src/lib/sessionLogger.js](src/lib/sessionLogger.js)**
   - Added detailed console logging with emojis for easy debugging
   - `logLogoutSession()` now:
     - Finds active session for user
     - Sets logoutTime to current timestamp
     - Calculates sessionDuration in seconds
     - Updates device info if provided from client
     - Saves changes to database

2. **Updated [src/routes/authRoutes.js](src/routes/authRoutes.js) - POST /logout**
   - Improved JWT handling (same as GET /me)
   - Extracts device info from request body
   - Passes device info to logLogoutSession()

---

## New Debug Endpoint

**GET /api/auth/debug/latest-sessions** (Development only)
- View latest 10 login sessions
- Shows complete session details including device info
- Helpful for troubleshooting

Example response:
```json
{
  "count": 3,
  "sessions": [
    {
      "email": "user@test.com",
      "status": "logged_out",
      "device": "iPhone 14 Pro",
      "platform": "ios",
      "osVersion": "17.2.1",
      "appVersion": "1.0.0",
      "ip": "192.168.0.108",
      "loginTime": "2026-01-11T07:15:34.200Z",
      "logoutTime": "2026-01-11T07:16:19.251Z",
      "sessionDuration": 45
    }
  ]
}
```

---

## Data Flow Now

### Login Flow
```
Mobile App
  ↓
getDeviceInfo() → collects device data
  ↓
formatDeviceInfoForBackend() → formats for transmission
  ↓
authStore.login() → includes deviceInfo in POST /login request
  ↓
Backend receives deviceInfo in req.body
  ↓
logLoginSession(req, ...) → reads deviceInfo from req.body
  ↓
LoginSession created with complete device information
  ↓
Database stores device name, platform, OS version, app version, IP
```

### Logout Flow
```
Mobile App Settings Screen
  ↓
authStore.logout() → reads stored deviceInfo from AsyncStorage
  ↓
Calls POST /api/auth/logout with token and deviceInfo
  ↓
Backend verifies token (with improved error handling)
  ↓
logLogoutSession(userId, deviceInfo) → updates session
  ↓
Finds active session for user
  ↓
Sets logoutTime, status = "logged_out", calculates sessionDuration
  ↓
Updates deviceInfo with fresh data from client
  ↓
Saves to database
```

---

## Console Logging for Debugging

The system now uses emoji prefixes for easy log scanning:

```
📝 Logging login session: { email: 'user@test.com', device: 'iPhone 14 Pro', ... }
✅ Session logged with ID: 65f8a1b2c3d4e5f6a7b8c9d0

🔍 Found active session for user: 695cc3fa9f6e16d2e9340204
📱 Updating device info at logout: { platform: 'ios', osVersion: '17.2.1', ... }
✅ Session closed - Duration: 45 seconds

⚠️ No active session found for user: ...
❌ Error logging logout session: ...

📋 Retrieved 5 sessions for user: 695cc3fa9f6e16d2e9340204
```

---

## Files Modified Summary

### Backend (3 files)
- ✅ [src/routes/authRoutes.js](src/routes/authRoutes.js)
  - Better JWT error handling in GET /me
  - Better JWT error handling in GET /login-history
  - POST /logout handles device info
  - New debug endpoint: GET /debug/latest-sessions

- ✅ [src/routes/artistAuthRoutes.js](src/routes/artistAuthRoutes.js)
  - Better JWT error handling in POST /logout

- ✅ [src/lib/sessionLogger.js](src/lib/sessionLogger.js)
  - Enhanced logLoginSession() with logging
  - Enhanced logLogoutSession() with device info update and logging

### Mobile (3 files)
- ✅ [mobile/lib/deviceInfo.js](mobile/lib/deviceInfo.js) - NEW FILE
  - Device information collection utilities

- ✅ [mobile/store/authStore.jsx](mobile/store/authStore.jsx)
  - Updated import to use deviceInfo utility
  - login() captures and sends device info
  - logout() sends device info with logout request

- ✅ [mobile/lib/http.jsx](mobile/lib/http.jsx)
  - Auto-adds Authorization header with token

- ✅ [mobile/constants/api.jsx](mobile/constants/api.jsx)
  - Added logout endpoints

---

## Testing Checklist

- [ ] Restart backend: `npm run dev`
- [ ] Mobile app running on Expo
- [ ] Login with test account
- [ ] Check backend terminal for 📝 and ✅ logs
- [ ] Visit http://192.168.0.106:3000/api/auth/debug/latest-sessions
- [ ] Verify device info is NOT "Unknown"
- [ ] Logout from mobile app
- [ ] Check backend terminal for 🔍, 📱, ✅ logs
- [ ] Visit debug endpoint again
- [ ] Verify logout time is populated
- [ ] Verify session duration is calculated
- [ ] Call GET /api/auth/login-history with token
- [ ] Verify all sessions show device info

---

## What Happens When Working Correctly

**At Login:**
```
Backend log:
📝 Logging login session: {
  email: 'user@test.com',
  ip: '192.168.0.108',
  successful: true,
  device: 'iPhone 14 Pro',    ← NOT "Unknown"
  platform: 'ios'              ← NOT "Unknown"
}
✅ Session logged with ID: 65f8a1...
```

**At Logout:**
```
Backend log:
🔍 Found active session for user: 695cc3fa9f6e16d2e9340204
📱 Updating device info at logout: { platform: 'ios', osVersion: '17.2.1', ... }
✅ Session closed - Duration: 45 seconds
```

**Database Record:**
```json
{
  "email": "user@test.com",
  "status": "logged_out",
  "device": "iPhone 14 Pro",
  "platform": "ios",
  "osVersion": "17.2.1",
  "appVersion": "1.0.0",
  "loginTime": "2026-01-11T07:15:34.200Z",
  "logoutTime": "2026-01-11T07:16:19.251Z",
  "sessionDuration": 45,
  "ipAddress": "192.168.0.108"
}
```
