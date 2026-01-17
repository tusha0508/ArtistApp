import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
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
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
    },

    // Amount breakdown
    totalAmount: {
      type: Number,
      required: true, // Final negotiated amount
    },
    advanceAmount: {
      type: Number,
      required: true, // 15% of total
    },
    remainingAmount: {
      type: Number,
      required: true, // 85% of total
    },

    // Payment status
    advancePaymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    remainingPaymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },

    // Razorpay details
    advancePaymentOrder: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },
    remainingPaymentOrder: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },

    // Refund details
    refund: {
      isRefundRequested: {
        type: Boolean,
        default: false,
      },
      refundReason: String,
      daysBeforeEvent: Number, // calculated at refund request
      refundPercentage: Number, // 100% for >3 days, 50% for 1-3 days, 0% for <1 day
      refundAmount: Number,
      razorpayRefundId: String,
      refundStatus: {
        type: String,
        enum: ["NOT_INITIATED", "PROCESSING", "COMPLETED", "FAILED"],
        default: "NOT_INITIATED",
      },
      refundInitiatedAt: Date,
      refundCompletedAt: Date,
    },

    // Payment timestamps
    advancePaymentAt: Date,
    remainingPaymentAt: Date,
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
