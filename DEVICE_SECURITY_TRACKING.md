# Device Security Tracking for Login Sessions

## What We're Capturing & Why

### Device Information Stored in LoginSession

For security purposes, we track the following device information on every login and logout:

#### 1. **Device Identification**
   - **deviceName**: The name of the device (e.g., "iPhone 14 Pro", "Pixel 6")
   - **deviceModel**: Model identifier
   - **manufacturer**: Device manufacturer (Apple, Samsung, etc.)
   - **purpose**: Helps identify if the same device consistently logs in, or if unusual devices access the account

#### 2. **Operating System (OS) Information**
   - **platform**: iOS or Android
   - **osVersion**: Exact OS version (e.g., "17.2.1")
   - **systemVersion**: System build version
   - **purpose**: Detects if account is accessed from unexpected OS versions or new devices

#### 3. **Application Information**
   - **appVersion**: Version of your app (e.g., "1.0.0")
   - **appBuildNumber**: Build number of the release
   - **purpose**: Ensures compatibility and detects unusual client access patterns

#### 4. **Device Type**
   - **deviceType**: Type of device (phone, tablet, watch)
   - **isDevice**: Boolean - actual device vs emulator/simulator
   - **purpose**: Differentiates between real devices and test environments

#### 5. **IP Address**
   - **ipAddress**: IP address where login occurred
   - **purpose**: Geographic and network tracking for suspicious activity detection

#### 6. **HTTP/Network Info**
   - **userAgent**: User-Agent string (HTTP client identifier)
   - **purpose**: Detects unusual client applications or automated access

---

## Data Flow

### Login Process
1. Mobile app calls `getDeviceInfo()` to collect device data
2. Device info is formatted and sent with login request
3. Backend logs all device info along with IP address
4. Session created with status `"active"`

### Logout Process
1. Mobile app reads stored device info from AsyncStorage
2. Sends device info with logout request
3. Backend updates the session with logout timestamp
4. Session status changed to `"logged_out"`
5. Session duration calculated automatically

---

## Security Use Cases

### 1. **Detect Unauthorized Access**
```
IF login from unknown device AND from new IP address
THEN: Flag as suspicious, may send alert email
```

### 2. **Track Session Duration**
```
Identifies how long sessions typically last
Detects premature logouts (potential account compromise)
```

### 3. **Geographic Anomaly Detection**
```
IF device logs in from IP in Country A, then 15 minutes later from Country B
THEN: Impossible travel pattern, flag as fraudulent
```

### 4. **Device Fingerprinting**
```
Combination of platform + OS + device model = unique fingerprint
Detects if same device is being used for multiple accounts
```

### 5. **Account Activity Report**
```
Users can view login history with:
- When they logged in/out (timestamps)
- From which device (name, model)
- From which location (IP address)
- How long the session lasted
```

---

## Implementation Details

### Backend LoginSession Schema
```javascript
{
  userId: ObjectId,           // Which user
  userRole: String,           // 'user' or 'artist'
  email: String,              // Email for quick lookup
  ipAddress: String,          // Where from
  deviceInfo: {
    userAgent: String,        // HTTP client
    platform: String,         // ios/android
    osVersion: String,        // OS version
    appVersion: String,       // App version
    deviceName: String,       // Device name
    deviceType: String,       // phone/tablet/watch
    isDevice: Boolean,        // Real or emulated
    modelId: String,          // Unique model ID
  },
  loginTime: Date,            // When logged in
  logoutTime: Date,           // When logged out
  sessionDuration: Number,    // Seconds (calculated)
  status: String,             // 'active', 'logged_out', 'failed'
  loginSuccessful: Boolean,   // True if login succeeded
  failureReason: String,      // e.g., "Invalid password"
  lastActivityTime: Date,     // Last interaction time
}
```

### Mobile App Collection
```javascript
// In authStore.jsx login():
const deviceInfo = await getDeviceInfo();
const formattedDeviceInfo = formatDeviceInfoForBackend(deviceInfo);
// Send with login request body
```

### API Endpoints for Management

**Login with device tracking:**
```
POST /api/auth/login
Body: { email, password, deviceInfo }
```

**Logout with device tracking:**
```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
Body: { deviceInfo }
```

**View login history:**
```
GET /api/auth/login-history?limit=50
Headers: Authorization: Bearer <token>
Response: Array of LoginSession documents
```

---

## Privacy Considerations

### What We Store:
✅ Device type and model (needed for security)
✅ IP address (network security)
✅ Login/logout times (activity audit)
✅ Session duration (behavioral analysis)

### What We Don't Store:
❌ Personally identifiable device info (serial numbers stored privately)
❌ Contacts or app lists
❌ Photos or private data
❌ Exact location (only IP-based approximation)
❌ Device identifiers beyond model/manufacturer

---

## Future Enhancements

1. **Suspicious Activity Alerts**
   - Email alert when login from new device
   - Email alert for unusual location changes

2. **Session Management**
   - Ability to remotely log out sessions
   - Block specific devices from logging in

3. **Risk Scoring**
   - Assign risk score to each login based on device/IP/time
   - Require 2FA for high-risk logins

4. **Device Trust**
   - Users can mark devices as "trusted"
   - Reduced friction for trusted devices

5. **Behavioral Analytics**
   - Detect unusual login patterns
   - Machine learning for anomaly detection
