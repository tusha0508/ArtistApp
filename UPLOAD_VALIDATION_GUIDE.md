# Portfolio Upload Validation - Complete Implementation

## Overview
Comprehensive file validation system for portfolio uploads with frontend validation, backend verification, video duration checking, and user-friendly error messages.

---

## 📋 Upload Limits Configuration

### Photos
- **Supported Formats:** JPG, JPEG, PNG, WebP, GIF
- **Maximum Size:** 50 MB
- **Quality:** 0.8 (Expo setting)

### Videos
- **Supported Formats:** MP4, MOV, WebM
- **Maximum Size:** 200 MB
- **Maximum Duration:** 5 minutes (300 seconds)

---

## 🎯 Implementation Details

### Frontend (Mobile - React Native)

#### 1. **File Size Detection**
- Uses `expo-file-system` to get file size in bytes
- Converts to MB for comparison with limits
- Runs before upload to prevent unnecessary network requests

#### 2. **Video Duration Checking**
- Uses `expo-video-thumbnails` (already installed via `expo-av`)
- Extracts video duration from metadata
- Validates against 5-minute limit
- Returns duration in seconds for precise validation

#### 3. **File Format Validation**
- Extracts file extension from URI
- Checks against supported format arrays
- Case-insensitive comparison

#### 4. **Validation Flow**
```
User selects file
    ↓
validateFile(asset)
    ├─ Check format (JPG, PNG, MP4, etc.)
    ├─ Check file size (50MB photos, 200MB videos)
    ├─ Check video duration (5 minutes max)
    ↓
If valid → Upload to Cloudinary
If invalid → Show error modal with details
```

#### 5. **Error Messages**
- **Invalid Format:** Lists supported formats
- **File Too Large:** Shows max size and actual file size
- **Video Too Long:** Shows max duration and actual duration

### Backend (Node.js/Express)

#### 1. **Validation Endpoint**
- Route: `POST /api/uploads/validate`
- Requires authentication (artist or user)
- Accepts: `filename`, `contentType`, `fileSizeMB`, `videoDurationSeconds`
- Returns validation result with specific error codes

#### 2. **Error Codes**
- `INVALID_FORMAT` - Unsupported file type
- `FILE_TOO_LARGE` - File exceeds size limit (413 status)
- `VIDEO_TOO_LONG` - Video exceeds duration limit (413 status)

#### 3. **Server-Side Protection**
- Validates on both upload sign and after Cloudinary upload
- Prevents malicious/oversized files from being stored
- Provides clear error messages for UX

---

## 🔧 Code Changes Summary

### Frontend Files Modified

**File:** `mobile/app/(artist-tabs)/upload.jsx`

**New Imports:**
```javascript
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
```

**New Constants:**
```javascript
const UPLOAD_LIMITS = {
  PHOTO: {
    maxSizeMB: 50,
    supportedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
    displayName: "Photos",
  },
  VIDEO: {
    maxSizeMB: 200,
    maxDurationSeconds: 300,
    supportedFormats: ["mp4", "mov", "webm"],
    displayName: "Videos",
  },
};
```

**New Functions:**
- `getFileSize(uri)` - Gets file size from filesystem
- `getVideoDuration(uri)` - Extracts video duration using thumbnails
- `validateFile(asset)` - Main validation function with all checks

**New State:**
- `validationError` - Stores error message for modal
- `showValidationModal` - Controls error modal visibility

**UI Changes:**
- Upload limits info box (visible on main screen)
- Validation error modal with clear error messages
- Loading state on upload button

### Backend Files Modified

**File:** `backend/src/controllers/uploadController.js`

**New Constants:**
```javascript
const UPLOAD_LIMITS = {
  PHOTO: { maxSizeMB: 50, supportedFormats: [...] },
  VIDEO: { maxSizeMB: 200, maxDurationSeconds: 300, supportedFormats: [...] }
};
```

**New Functions:**
- `validateFileUpload()` - Server-side validation logic
- `validateUpload` - Exported validation handler

**File:** `backend/src/routes/uploadRoutes.js`

**New Route:**
- `POST /api/uploads/validate` - Validation endpoint
- Requires auth middleware
- Returns `{ valid: true }` or error response

---

## 🚀 Usage Flow

### Frontend Validation
1. User taps "Upload Portfolio"
2. Select image or video from library
3. `validateFile()` runs:
   - ✅ Format check
   - ✅ File size check
   - ✅ Video duration check (if video)
4. If valid → Upload to Cloudinary
5. If invalid → Show error modal with specific issue

### Backend Validation (Optional)
Send to `/api/uploads/validate` endpoint:
```json
{
  "filename": "video.mp4",
  "contentType": "video/mp4",
  "fileSizeMB": 150,
  "videoDurationSeconds": 245
}
```

Response:
```json
{
  "valid": true
}
```

Or error:
```json
{
  "message": "Video too long. Max duration: 5 minutes. Your video: 4m 5s",
  "code": "VIDEO_TOO_LONG"
}
```

---

## ✨ Error Messages Examples

### Invalid Format
```
⚠️ Upload Failed
Invalid photos format.
Supported: JPG, JPEG, PNG, WEBP, GIF
```

### File Too Large
```
⚠️ Upload Failed
File too large.
Max size: 50MB
Your file: 75.34MB
```

### Video Too Long
```
⚠️ Upload Failed
Video too long.
Max duration: 5 minutes
Your video: 6m 15s
```

---

## 📱 Display Information

### On Upload Screen
```
📋 Upload Limits:
📷 Photos: Max 50MB | Formats: JPG, PNG, WebP, GIF
🎬 Videos: Max 200MB, 5 min | Formats: MP4, MOV, WebM
```

---

## 🔐 Security Benefits

1. **Frontend Protection** - Prevents unnecessary uploads
2. **Backend Verification** - Server-side safety checks
3. **Clear Feedback** - Users understand why uploads fail
4. **Format Validation** - Only allowed types processed
5. **Size Limits** - Prevents storage bloat
6. **Duration Limits** - Ensures reasonable file sizes

---

## 📦 Dependencies Used

- `expo-file-system` - File size detection
- `expo-video-thumbnails` - Video metadata extraction
- `expo-image-picker` - File selection (already present)
- Express.js - Backend validation endpoint

All required packages are already installed in the project.

---

## ✅ Testing Checklist

- [ ] Upload valid 5MB image → Should succeed
- [ ] Upload 55MB image → Should show size error
- [ ] Upload invalid format → Should show format error
- [ ] Upload 4-minute video → Should succeed
- [ ] Upload 6-minute video → Should show duration error
- [ ] Check UI shows limits info on upload screen
- [ ] Test error modal displays correctly
- [ ] Test on both iOS and Android

---

## 🎨 Color Coding

- 🟢 Success: Green toast (Profile photo updated)
- 🔴 Error: Red toast (Couldn't update)
- 🟡 Warning: Yellow/orange error modal (#FF6B6B)
- 📋 Info: Upload limits display in input background color
