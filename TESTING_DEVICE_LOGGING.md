# Testing & Debugging Device Info & Session Logging

## Issues Fixed ✅

1. **JWT Malformed Error on GET /me**: Improved token parsing with better error handling
2. **Device Info Not Captured**: Updated mobile app to automatically send device data in login request
3. **Logout Time Not Showing**: Added detailed logging to track session closure

## How to Test

### 1. Restart Backend Server
```bash
cd D:\ArtistApp2.0\backend
npm run dev
```
**Watch for logs like:**
```
✅ Session logged with ID: 675a1b2c3d4e5f6a7b8c9d0e
📝 Logging login session: { email: 'user@test.com', device: 'iPhone 14 Pro', ... }
```

### 2. Login from Mobile App
1. Open mobile app (should already be running on Expo)
2. Go to login screen
3. Enter credentials and login
4. **Check backend terminal** - should show device info logging

**Expected output in backend terminal:**
```
📝 Logging login session: {
  email: 'user@email.com',
  ip: '192.168.0.108',
  successful: true,
  device: 'iPhone 14 Pro',  ← Should NOT be 'Unknown'
  platform: 'ios'           ← Should NOT be 'Unknown'
}
✅ Session logged with ID: 65f8a1b2c3d4e5f6a7b8c9d0
```

### 3. View Latest Sessions (Debug Endpoint)
Open browser and visit:
```
http://192.168.0.106:3000/api/auth/debug/latest-sessions
```

**You should see:**
```json
{
  "count": 10,
  "sessions": [
    {
      "email": "user@test.com",
      "status": "active",
      "device": "iPhone 14 Pro",
      "platform": "ios",
      "osVersion": "17.2.1",
      "appVersion": "1.0.0",
      "ip": "192.168.0.108",
      "loginTime": "2026-01-11T07:15:34.200Z",
      "logoutTime": null,
      "sessionDuration": null
    }
  ]
}
```

### 4. Test Logout
1. In mobile app, go to Settings → Logout
2. **Check backend terminal** - should show:
```
🔍 Found active session for user: 695cc3fa9f6e16d2e9340204
📱 Updating device info at logout: { platform: 'ios', osVersion: '17.2.1', ... }
✅ Session closed - Duration: 45 seconds
```

### 5. Verify Logout Time Updated
Visit debug endpoint again:
```
http://192.168.0.106:3000/api/auth/debug/latest-sessions
```

**Should now show:**
```json
{
  "email": "user@test.com",
  "status": "logged_out",      ← Changed from 'active'
  "logoutTime": "2026-01-11T07:16:19.251Z",  ← Now populated
  "sessionDuration": 45        ← Calculated in seconds
}
```

### 6. View Full Login History
Get your authorization token from mobile app (stored in AsyncStorage), then call:
```
GET http://192.168.0.106:3000/api/auth/login-history
Headers: Authorization: Bearer <your-token>
```

Or use the auth store method in your app to fetch and display history.

## What to Check If Device Info Still Shows "Unknown"

### Issue 1: deviceInfo Not Being Sent from Mobile
**Check in authStore.jsx:**
- `login()` method calls `getDeviceInfo()` ✓
- Device info is passed in request body ✓
- Token is stored in AsyncStorage ✓

### Issue 2: Backend Not Receiving Device Info
**Check in authRoutes.js login endpoint:**
```javascript
const deviceInfo = req.body?.deviceInfo || {};
```
Add logging:
```javascript
console.log("Received body:", req.body);
console.log("Device info from body:", deviceInfo);
```

### Issue 3: Token Not Being Added to Requests
**Verify http.jsx has Authorization header:**
```javascript
if (token && !headers.Authorization) {
  headers.Authorization = `Bearer ${token}`;
}
```

### Issue 4: Settings Page Not Reloading After Edit
**Should have useFocusEffect in settings.jsx:**
```javascript
useFocusEffect(
  useCallback(() => {
    loadUserDetails();
  }, [token])
);
```

## Expected Device Info Fields

When device info is captured properly, you should see:
- **deviceName**: "iPhone 14 Pro" or "Samsung Galaxy S23"
- **platform**: "ios" or "android"
- **osVersion**: "17.2.1", "14.1", etc.
- **appVersion**: "1.0.0"
- **userAgent**: "okhttp/4.12.0" (for mobile)

## Troubleshooting Commands

### Check MongoDB for sessions:
```bash
# In MongoDB shell
db.loginsessions.find().sort({createdAt: -1}).limit(5).pretty()
```

### Watch backend logs in real-time:
```bash
npm run dev  # Should show all 📝, 📱, ✅, 🔍, ❌ emoji logs
```

### Test Token Manually:
```bash
# In terminal, get a login response token and test:
curl -X GET http://192.168.0.106:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Success Indicators ✅

You'll know everything is working when:
1. ✅ Device info shows device name, not "Unknown"
2. ✅ Platform shows "ios" or "android", not "Unknown"
3. ✅ OS version shows actual version, not "Unknown"
4. ✅ Logout time is populated after logout
5. ✅ Session duration is calculated (in seconds)
6. ✅ Status changes from "active" to "logged_out"
7. ✅ Backend logs show emojis (📝✅🔍📱❌)

## Debug Endpoint (For Development Only)
⚠️ **Note:** The `/api/auth/debug/latest-sessions` endpoint should be removed or protected in production!
