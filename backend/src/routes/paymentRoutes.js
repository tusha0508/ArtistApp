import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import {
  createAdvancePaymentOrder,
  verifyAdvancePayment,
  createRemainingPaymentOrder,
  verifyRemainingPayment,
  requestRefund,
  getPaymentDetails,
  cancelBooking,
} from "../controllers/paymentController.js";

const router = express.Router();

// Get Razorpay Key (public endpoint - no auth needed)
router.get("/razorpay-key", (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID) {
      return res.status(500).json({ message: "Razorpay key not configured" });
    }
    res.status(200).json({ keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: "Failed to get Razorpay key" });
  }
});

// Advance Payment (15%)
router.post(
  "/advance/create-order",
  protectRoute(["user"]),
  createAdvancePaymentOrder
);
router.post(
  "/advance/verify",
  protectRoute(["user"]),
  verifyAdvancePayment
);

// Remaining Payment (85%)
router.post(
  "/remaining/create-order",
  protectRoute(["artist", "user"]),
  createRemainingPaymentOrder
);
router.post(
  "/remaining/verify",
  protectRoute(["artist", "user"]),
  verifyRemainingPayment
);

// Refund
router.post("/refund/request", protectRoute(["user"]), requestRefund);

// Get Payment Details
router.get("/details/:bookingId", getPaymentDetails);

// Cancel Booking (with shadow ban tracking)
router.post("/booking/cancel", protectRoute(["artist"]), cancelBooking);

export default router;
