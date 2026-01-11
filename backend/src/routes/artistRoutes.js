// routes/artistRoutes.js
import express from "express";
import {
  getMeArtist,
  updateMeArtist,
  changePasswordArtist,
  getArtistById,
  searchArtists,
  getCities,
  deleteMeArtist,
  refreshTokenArtist,
} from "../controllers/artistController.js";
import protectRoute from "../middleware/auth.middleware.js";
import { followArtist, unfollowArtist } from "../controllers/followController.js";
const router = express.Router();

// protected artist-only
router.get("/me", protectRoute(["artist"]), getMeArtist);
router.put("/me", protectRoute(["artist"]), updateMeArtist);
router.put("/me/password", protectRoute(["artist"]), changePasswordArtist);
router.delete("/me", protectRoute(["artist"]), deleteMeArtist);
router.post("/refresh", refreshTokenArtist);

// public
router.get("/cities", getCities);
router.get("/", searchArtists); // /api/artists?search=name
router.get("/:id", getArtistById);

router.post("/:id/follow", protectRoute(["user"]), followArtist);
router.delete("/:id/follow", protectRoute(["user"]), unfollowArtist);
export default router;
