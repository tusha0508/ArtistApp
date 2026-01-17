// models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },

    eventDate: { type: Date, required: true },
    eventTime: { type: String, required: true }, // "16:00"
    durationHours: { type: Number, required: true },

    location: { type: String, required: true },

    description: { type: String },

    proposedBudget: { type: Number, required: true },
    
    finalAmount: {
      type: Number,
      required: true, // Set when booking is confirmed (either proposedBudget or counterOfferAmount)
    },

    status: {
      type: String,
      enum: ["REQUESTED",        // user → artist
    "COUNTER_OFFER",    // artist → user
    "ACCEPTED",         // artist accepted directly (pending payment)
    "PAYMENT_PENDING",  // awaiting advance payment
    "CONFIRMED",        // user accepted counter (pending payment)
    "PAYMENT_FAILED",   // advance payment failed
    "ACTIVE",           // advance payment successful, event is live
    "COMPLETED",        // event completed, awaiting remaining payment
    "REJECTED",         // artist rejected
    "USER_REJECTED",    // user rejected counter
    "CANCELLED"],       // booking cancelled
      default: "REQUESTED",
    },

    paymentStatus: {
      advancePaid: {
        type: Boolean,
        default: false,
      },
      remainingPaid: {
        type: Boolean,
        default: false,
      },
    },

    artistMessage: { type: String },
    counterOfferAmount: { type: Number },
    
    // Cancellation tracking
    artistCancelledAt: Date,
    artistCancelReason: String,
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
