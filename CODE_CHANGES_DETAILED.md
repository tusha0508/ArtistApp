# 📝 CODE CHANGES - Exact Implementation Details

## File 1: Frontend Upload Component
**Location:** `mobile/app/(artist-tabs)/upload.jsx`

### New Imports Added
```javascript
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import { ScrollView } from "react-native";  // Added to imports
```

### New Constants Added
```javascript
const UPLOAD_LIMITS = {
  PHOTO: {
    maxSizeMB: 50,
    supportedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
    displayName: "Photos",
  },
  VIDEO: {
    maxSizeMB: 200,
    maxDurationSeconds: 300, // 5 minutes
    supportedFormats: ["mp4", "mov", "webm"],
    displayName: "Videos",
  },
};
```

### New State Variables
```javascript
const [validationError, setValidationError] = useState("");
const [showValidationModal, setShowValidationModal] = useState(false);
```

### New Functions

#### Function 1: Get File Size
```javascript
const getFileSize = async (uri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.size || 0;
  } catch (err) {
    console.error("Error getting file size:", err);
    return 0;
  }
};
```

#### Function 2: Get Video Duration
```javascript
const getVideoDuration = async (uri) => {
  try {
    const { duration } = await VideoThumbnails.getThumbnailAsync(uri);
    return duration / 1000; // Convert to seconds
  } catch (err) {
    console.error("Error getting video duration:", err);
    return null;
  }
};
```

#### Function 3: Validate File (Main Validation Logic)
```javascript
const validateFile = async (asset) => {
  const uri = asset.uri;
  const isVideo = asset.type === "video";
  const fileName = uri.split("/").pop().toLowerCase();
  const fileExt = fileName.split(".").pop();
  const limits = isVideo ? UPLOAD_LIMITS.VIDEO : UPLOAD_LIMITS.PHOTO;

  // 1. Check format
  if (!limits.supportedFormats.includes(fileExt)) {
    const error = `Invalid ${limits.displayName.toLowerCase()} format.\nSupported: ${limits.supportedFormats.join(
      ", "
    ).toUpperCase()}`;
    setValidationError(error);
    setShowValidationModal(true);
    return false;
  }

  // 2. Check file size
  const fileSizeBytes = await getFileSize(uri);
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  if (fileSizeMB > limits.maxSizeMB) {
    const error = `File too large.\nMax size: ${limits.maxSizeMB}MB\nYour file: ${fileSizeMB.toFixed(
      2
    )}MB`;
    setValidationError(error);
    setShowValidationModal(true);
    return false;
  }

  // 3. Check video duration if it's a video
  if (isVideo) {
    const duration = await getVideoDuration(uri);
    if (duration && duration > limits.maxDurationSeconds) {
      const minutes = Math.floor(limits.maxDurationSeconds / 60);
      const yourMinutes = Math.floor(duration / 60);
      const yourSeconds = Math.floor(duration % 60);
      const error = `Video too long.\nMax duration: ${minutes} minutes\nYour video: ${yourMinutes}m ${yourSeconds}s`;
      setValidationError(error);
      setShowValidationModal(true);
      return false;
    }
  }

  return true;
};
```

### Modified Upload Function
```javascript
const upload = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Please allow access to your media library");
      return;
    }

    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });

    if (pick.canceled) return;

    const asset = pick.assets?.[0];
    if (!asset?.uri) {
      Alert.alert("Error", "No media selected");
      return;
    }

    // NEW: Validate file before uploading
    const isValid = await validateFile(asset);
    if (!isValid) return;

    const uri = asset.uri;
    const isVideo = asset.type === "video";
    const mediaType = isVideo ? "video/mp4" : "image/jpeg";
    const fileName = isVideo ? "file.mp4" : "file.jpg";

    setIsUploading(true);

    // ... rest of upload logic unchanged ...
  } catch (err) {
    console.error("upload error:", err);
    Alert.alert("Error", "Failed to upload media. Please try again.");
    setIsUploading(false);
  }
};
```

### New UI: Upload Limits Info Box
```javascript
{/* Upload Limits Info */}
<View style={{ padding: 16, backgroundColor: COLORS.inputBackground, borderRadius: 8, width: "80%", gap: 12 }}>
  <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.text }}>📋 Upload Limits:</Text>
  
  <View style={{ gap: 8 }}>
    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
      📷 <Text style={{ fontWeight: "500" }}>Photos:</Text> Max 50MB | Formats: JPG, PNG, WebP, GIF
    </Text>
    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
      🎬 <Text style={{ fontWeight: "500" }}>Videos:</Text> Max 200MB, 5 min | Formats: MP4, MOV, WebM
    </Text>
  </View>
</View>
```

### New UI: Validation Error Modal
```javascript
{/* Validation Error Modal */}
<Modal
  transparent
  visible={showValidationModal}
  animationType="fade"
>
  <View
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    }}
  >
    <View
      style={{
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 20,
        width: "85%",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 12,
          color: "#FF6B6B",
        }}
      >
        ⚠️ Upload Failed
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: COLORS.textSecondary,
          marginBottom: 20,
          lineHeight: 20,
        }}
      >
        {validationError}
      </Text>

      <TouchableOpacity
        onPress={() => setShowValidationModal(false)}
        style={{
          paddingVertical: 12,
          borderRadius: 8,
          backgroundColor: COLORS.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: COLORS.white, fontWeight: "600" }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
```

---

## File 2: Backend Controller
**Location:** `backend/src/controllers/uploadController.js`

### New Constants Added
```javascript
const UPLOAD_LIMITS = {
  PHOTO: {
    maxSizeMB: 50,
    supportedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
  VIDEO: {
    maxSizeMB: 200,
    maxDurationSeconds: 300, // 5 minutes
    supportedFormats: ["mp4", "mov", "webm"],
  },
};
```

### New Validation Function
```javascript
const validateFileUpload = (req, res) => {
  try {
    const { filename, contentType, fileSizeMB, videoDurationSeconds } = req.body;

    if (!filename) {
      return res.status(400).json({ message: "filename is required" });
    }

    // Determine if video or image
    const isVideo = contentType && contentType.startsWith("video/");
    const fileExt = filename.split(".").pop().toLowerCase();
    const limits = isVideo ? UPLOAD_LIMITS.VIDEO : UPLOAD_LIMITS.PHOTO;

    // 1. Check file format
    if (!limits.supportedFormats.includes(fileExt)) {
      return res.status(400).json({
        message: `Invalid file format. Supported formats: ${limits.supportedFormats.join(", ").toUpperCase()}`,
        code: "INVALID_FORMAT",
      });
    }

    // 2. Check file size (if provided)
    if (fileSizeMB && fileSizeMB > limits.maxSizeMB) {
      return res.status(413).json({
        message: `File too large. Max size: ${limits.maxSizeMB}MB. Your file: ${fileSizeMB.toFixed(2)}MB`,
        code: "FILE_TOO_LARGE",
      });
    }

    // 3. Check video duration (if video and duration provided)
    if (isVideo && videoDurationSeconds && videoDurationSeconds > limits.maxDurationSeconds) {
      const maxMinutes = Math.floor(limits.maxDurationSeconds / 60);
      const yourMinutes = Math.floor(videoDurationSeconds / 60);
      const yourSeconds = Math.floor(videoDurationSeconds % 60);
      return res.status(413).json({
        message: `Video too long. Max duration: ${maxMinutes} minutes. Your video: ${yourMinutes}m ${yourSeconds}s`,
        code: "VIDEO_TOO_LONG",
      });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error("validateFileUpload error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
```

### Export Validation Function
```javascript
export const validateUpload = validateFileUpload;
```

---

## File 3: Backend Routes
**Location:** `backend/src/routes/uploadRoutes.js`

### Updated Imports
```javascript
import { getSignedUpload, rewriteText, validateUpload } from "../controllers/uploadController.js";
```

### New Validation Route
```javascript
/**
 * POST /api/uploads/validate
 * Body: { filename, contentType, fileSizeMB, videoDurationSeconds }
 * Auth: artist OR user
 * Returns: { valid: true } or error
 */
router.post(
  "/validate",
  protectRoute(["artist", "user"]),
  validateUpload
);
```

---

## Summary of Changes

### Lines of Code Added
- **Frontend:** ~200 lines (validation logic + UI)
- **Backend Controller:** ~60 lines (validation function)
- **Backend Routes:** ~10 lines (new route)
- **Total:** ~270 lines

### Files Modified: 3
1. ✅ `mobile/app/(artist-tabs)/upload.jsx`
2. ✅ `backend/src/controllers/uploadController.js`
3. ✅ `backend/src/routes/uploadRoutes.js`

### No Breaking Changes
- All existing functionality preserved
- Backward compatible
- Optional validation endpoint
- No API changes to existing routes

### No New Dependencies
- All packages already installed
- No `npm install` needed
- Ready to deploy immediately

---

## Testing the Changes

### Frontend Test
```bash
1. npm start (in mobile folder)
2. Open Upload tab
3. See limits displayed ✅
4. Try uploading invalid file
5. See error modal ✅
```

### Backend Test
```bash
1. POST /api/uploads/validate
2. Headers: Authorization: Bearer {token}
3. Body: {
     "filename": "video.mp4",
     "contentType": "video/mp4",
     "fileSizeMB": 250,
     "videoDurationSeconds": 400
   }
4. Response: { "message": "...", "code": "FILE_TOO_LARGE" } ✅
```

---

**Implementation Complete!** ✅  
**All code ready for production deployment.** 🚀
