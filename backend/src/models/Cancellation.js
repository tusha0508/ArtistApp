import mongoose from "mongoose";

const cancellationSchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cancelledAt: {
      type: Date,
      default: Date.now,
    },
    reason: String,
  },
  { timestamps: true }
);

// Index for efficient querying of cancellations within 7 days
cancellationSchema.index(
  { artistId: 1, createdAt: 1 }
);

const Cancellation = mongoose.model("Cancellation", cancellationSchema);
export default Cancellation;
