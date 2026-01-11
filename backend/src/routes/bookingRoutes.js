// routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getArtistBookings,
  getUserBookings,
  respondToBooking,
  confirmBooking,
  rejectCounterOffer,
} from "../controllers/bookingController.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===================== USER ===================== */

// create booking
router.post("/", protectRoute(["user"]), createBooking);

// view own bookings
router.get("/user", protectRoute(["user"]), getUserBookings);

// accept counter offer
router.put("/:id/confirm", protectRoute(["user"]), confirmBooking);

// reject counter offer
router.put("/:id/reject", protectRoute(["user"]), rejectCounterOffer);

/* ===================== ARTIST ===================== */

// view artist bookings
router.get("/artist", protectRoute(["artist"]), getArtistBookings);

// accept / reject / counter
router.put("/:id/respond", protectRoute(["artist"]), respondToBooking);
export default router;
