// routes/userRoutes.js
import express from "express";
import {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
  refreshToken,
} from "../controllers/userController.js";
import protectRoute from "../middleware/auth.middleware.js";
import { getFollowing } from "../controllers/followController.js";
const router = express.Router();

router.get("/me", protectRoute(["user"]), getMe);
router.put("/me", protectRoute(["user"]), updateMe);
router.put("/me/password", protectRoute(["user"]), changePassword);
router.delete("/me", protectRoute(["user"]), deleteMe);

// simple refresh endpoint
router.post("/refresh", refreshToken);

// FOLLOWING LIST
router.get("/:id/following", protectRoute(["user"]), getFollowing);
export default router;
