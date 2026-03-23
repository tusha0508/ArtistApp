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
    cancelledBy: {
      type: String,
      enum: ["artist", "user"],
      required: true,
    },
    cancelledAt: {
      type: Date,
      default: Date.now,
    },
    reason: String,
    
    // Refund tracking
    refund: {
      isRequested: { type: Boolean, default: false },
      daysBeforeEvent: Number, // calculated at time of cancellation
      refundPercentage: Number, // 100 for artist, calculated for user
      refundAmount: Number, // calculated amount
      razorpayPaymentId: String, // which payment to refund
      razorpayRefundId: String, // returned refund ID
      refundStatus: {
        type: String,
        enum: ["NOT_INITIATED", "PROCESSING", "COMPLETED", "FAILED"],
        default: "NOT_INITIATED",
      },
      refundInitiatedAt: Date,
      refundCompletedAt: Date,
      refundError: String,
    },
  },
  { timestamps: true }
);

// Index for efficient querying of cancellations within 7 days
cancellationSchema.index(
  { artistId: 1, createdAt: 1 }
);

const Cancellation = mongoose.model("Cancellation", cancellationSchema);
export default Cancellation;
