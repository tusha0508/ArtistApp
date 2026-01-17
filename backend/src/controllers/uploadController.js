// controllers/uploadController.js
import cloudinary from "../lib/cloudinary.js";

// Upload limits configuration
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

/**
 * Validate file before upload
 * Checks file type, size, and video duration
 */
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

/**
 * Generate signed upload params for Cloudinary
 * Auth: Artist or User
 */
export const getSignedUpload = async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename) {
      return res.status(400).json({ message: "filename is required" });
    }

    // Optional: restrict formats
    const allowedTypes = ["image/", "video/"];
    if (
      contentType &&
      !allowedTypes.some((type) => contentType.startsWith(type))
    ) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    const timestamp = Math.round(Date.now() / 1000);

    const folder =
      req.user.role === "artist"
        ? `artist/${req.user._id}`
        : `user/${req.user._id}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
    });
  } catch (err) {
    console.error("getSignedUpload error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Validate file upload parameters
 * Auth: Artist or User
 */
export const validateUpload = validateFileUpload;

/**
 * Rewrite text with AI (bio or caption)
 * Auth: Artist or User
 */
export const rewriteText = async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    if (!type || !["bio", "caption"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Type must be 'bio' or 'caption'" });
    }

    // Check if AI is configured
    if (!process.env.AI_PROVIDER) {
      return res.status(503).json({
        message: "AI rewriting service is not configured. Please set AI_PROVIDER.",
      });
    }

    const rewrittenText = await rewriteTextWithAI(text, type);
    return res.status(200).json({ rewritten: rewrittenText });
  } catch (err) {
    console.error("rewriteText error:", err);

    // Return specific error messages for better UX
    if (err.message.includes("not configured")) {
      return res
        .status(503)
        .json({ message: "AI service is not properly configured" });
    }

    return res
      .status(500)
      .json({ message: "Failed to rewrite text. Please try again." });
  }
};

