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
      enum: [
        "pending",        // awaiting advance payment
        "partial_paid",   // advance paid, remaining 85% pending
        "paid",           // both advance + remaining paid
        "cancelled"       // booking cancelled with refund
      ],
      default: "pending",
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
    userCancelledAt: Date,
    userCancelReason: String,
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
