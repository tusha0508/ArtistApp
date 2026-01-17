import mongoose from "mongoose";

const loginSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    userRole: {
      type: String,
      enum: ["user", "artist"],
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
      osVersion: String,
      appVersion: String,
      deviceName: String,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    sessionDuration: {
      type: Number, // in seconds
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "logged_out", "expired", "failed"],
      default: "active",
    },
    loginSuccessful: {
      type: Boolean,
      default: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    lastActivityTime: {
      type: Date,
      default: Date.now,
    },
    loginSuccessful: {
      type: Boolean,
      default: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
loginSessionSchema.index({ userId: 1, loginTime: -1 });
loginSessionSchema.index({ ipAddress: 1 });
loginSessionSchema.index({ loginTime: -1 });

const LoginSession = mongoose.model("LoginSession", loginSessionSchema);
export default LoginSession;
