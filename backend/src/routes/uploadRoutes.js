// routes/uploadRoutes.js
import express from "express";
import { getSignedUpload, rewriteText } from "../controllers/uploadController.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/uploads/sign
 * Body: { filename, contentType }
 * Auth: artist OR user
 */
router.post(
  "/sign",
  protectRoute(["artist", "user"]),
  getSignedUpload
);

/**
 * POST /api/uploads/rewrite
 * Body: { text, type }
 * Auth: artist OR user
 */
router.post(
  "/rewrite",
  protectRoute(["artist", "user"]),
  rewriteText
);

export default router;
