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

    status: {
      type: String,
      enum: ["REQUESTED",        // user → artist
    "COUNTER_OFFER",    // artist → user
    "ACCEPTED",         // artist accepted directly
    "CONFIRMED",        // user accepted counter
    "REJECTED",         // artist rejected
    "USER_REJECTED"],     // user rejected counter],
      default: "REQUESTED",
    },

    artistMessage: { type: String },
    counterOfferAmount: { type: Number },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
