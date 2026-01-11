// routes/notificationRoutes.js
import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected routes (artist and user)
router.get("/", protectRoute(["artist", "user"]), getNotifications);
router.put("/:notificationId/read", protectRoute(["artist", "user"]), markAsRead);
router.put("/read-all", protectRoute(["artist", "user"]), markAllAsRead);
router.delete("/:notificationId", protectRoute(["artist", "user"]), deleteNotification);

export default router;
