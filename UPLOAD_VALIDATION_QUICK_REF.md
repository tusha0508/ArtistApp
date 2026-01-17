# 🎯 Portfolio Upload Validation - Quick Reference

## ✅ What Was Implemented

### Frontend (Mobile App)
1. **File Size Detection** ✓
   - Photos: Max 50MB
   - Videos: Max 200MB
   
2. **Video Duration Checking** ✓
   - Maximum 5 minutes (300 seconds)
   - Uses expo-video-thumbnails
   
3. **File Format Validation** ✓
   - Photos: JPG, JPEG, PNG, WebP, GIF
   - Videos: MP4, MOV, WebM
   
4. **User-Friendly Error Messages** ✓
   - Specific error modal showing what went wrong
   - Displays limits and actual file details
   - "Try Again" button to attempt re-upload

5. **Upload Limits Display** ✓
   - Info box on upload screen
   - Shows all limits and supported formats
   - Always visible to users

### Backend (Server)
1. **Validation Endpoint** ✓
   - POST `/api/uploads/validate`
   - Validates filename, size, duration
   
2. **Error Codes** ✓
   - `INVALID_FORMAT` - Wrong file type
   - `FILE_TOO_LARGE` - Size exceeds limit
   - `VIDEO_TOO_LONG` - Duration exceeds limit

3. **HTTP Status Codes** ✓
   - 400 - Bad format or validation error
   - 413 - Payload too large (file/video too long)
   - 500 - Server error

---

## 📊 Upload Limits Summary

| Type | Max Size | Duration | Formats |
|------|----------|----------|---------|
| **Photos** | 50 MB | N/A | JPG, JPEG, PNG, WebP, GIF |
| **Videos** | 200 MB | 5 min | MP4, MOV, WebM |

---

## 🔄 User Flow

```
┌─────────────────────────────────────────────┐
│ Upload Screen (Shows Limits)                │
│ 📷 Photos: Max 50MB | Formats: JPG, PNG... │
│ 🎬 Videos: Max 200MB, 5 min | Formats:...  │
└──────────────┬──────────────────────────────┘
               │
         User clicks "Upload Portfolio"
               │
┌──────────────v──────────────────────────────┐
│ Select Image/Video from Library             │
└──────────────┬──────────────────────────────┘
               │
         Validation Checks Run:
         1. Check format ✓
         2. Check size ✓
         3. Check duration ✓
               │
      ┌────────┴────────┐
      │                 │
   VALID              INVALID
      │                 │
      ↓                 ↓
  Upload to        Error Modal
 Cloudinary       Shows issue
      │                 │
      ↓                 ↓
  Caption       User retries
  Modal         or cancels
      │
      ↓
  Portfolio saved
```

---

## 💻 Files Modified

1. **Frontend:**
   - `mobile/app/(artist-tabs)/upload.jsx` - Added validation logic & UI

2. **Backend:**
   - `backend/src/controllers/uploadController.js` - Added validation function
   - `backend/src/routes/uploadRoutes.js` - Added validation endpoint

---

## 🎨 Error Modal Examples

### Example 1: Invalid Format
```
⚠️ Upload Failed

Invalid videos format.
Supported: MP4, MOV, WEBM

[Try Again Button]
```

### Example 2: File Too Large
```
⚠️ Upload Failed

File too large.
Max size: 50MB
Your file: 75.34MB

[Try Again Button]
```

### Example 3: Video Too Long
```
⚠️ Upload Failed

Video too long.
Max duration: 5 minutes
Your video: 6m 15s

[Try Again Button]
```

---

## 🔧 Testing Guide

### Test Case 1: Valid Photo Upload
- Select JPG/PNG under 50MB
- ✓ Should upload successfully
- ✓ Caption modal should appear

### Test Case 2: Valid Video Upload
- Select MP4 under 200MB, under 5 min
- ✓ Should upload successfully
- ✓ Caption modal should appear

### Test Case 3: Oversized Photo
- Try uploading 60MB image
- ✓ Should show error modal
- ✓ Error should say "Max size: 50MB"

### Test Case 4: Oversized Video
- Try uploading 250MB video
- ✓ Should show error modal
- ✓ Error should say "Max size: 200MB"

### Test Case 5: Long Video
- Try uploading 6-minute video
- ✓ Should show error modal
- ✓ Error should show actual duration

### Test Case 6: Invalid Format
- Try uploading .wav or .txt file
- ✓ Should show format error
- ✓ Should list supported formats

---

## 🚀 How to Use in App

### For Artist/User:
1. Open "Upload Portfolio" tab
2. See upload limits displayed
3. Tap "Upload Portfolio" button
4. Select image or video
5. System validates automatically
6. If valid → Add caption and submit
7. If invalid → Read error and try again

---

## 📱 API Endpoint Details

### Validation Endpoint (Optional)
```bash
POST /api/uploads/validate
Authorization: Bearer {token}

Request Body:
{
  "filename": "video.mp4",
  "contentType": "video/mp4",
  "fileSizeMB": 150,
  "videoDurationSeconds": 245
}

Response (Success):
{
  "valid": true
}

Response (Error):
{
  "message": "Video too long. Max duration: 5 minutes. Your video: 4m 5s",
  "code": "VIDEO_TOO_LONG"
}
```

---

## 🎓 Key Features

✅ **Pre-upload Validation** - Check before wasting bandwidth
✅ **Video Duration Detection** - Extracts from file metadata  
✅ **User-Friendly Errors** - Clear, actionable messages
✅ **Format Restrictions** - Only supported types accepted
✅ **Size Limits** - Prevents storage bloat
✅ **Visible Limits** - Users always know the rules
✅ **Backend Verification** - Server-side safety
✅ **Loading States** - Users see upload progress

---

## 📝 Notes

- All validation happens **synchronously** before upload
- Video duration check uses thumbnail extraction (fast)
- File size check uses filesystem API (reliable)
- Error messages include actual file details
- Limits are **centralized** in constants (easy to change)
- Backend validation can be called separately if needed

---

## 🔐 Security

- ✓ Frontend prevents invalid uploads
- ✓ Backend validates on receive
- ✓ Format whitelist prevents dangerous files
- ✓ Size limits prevent abuse
- ✓ Duration limits prevent excessive storage
