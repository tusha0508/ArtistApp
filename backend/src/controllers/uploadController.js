// controllers/uploadController.js
import cloudinary from "../lib/cloudinary.js";
import { rewriteTextWithAI } from "../services/aiRewriteService.js";

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

