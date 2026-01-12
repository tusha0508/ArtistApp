// routes/authRoutes.js
import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendOTPEmail, sendWelcomeEmail } from "../services/emailService.js";
import { logLoginSession, logLogoutSession, getUserLoginHistory, getClientIP } from "../lib/sessionLogger.js";

const router = express.Router();

const generateAuthToken = (userId, role = "user") => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, tncAccepted } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "Please fill all fields" });

    if (!tncAccepted) return res.status(400).json({ message: "You must accept Terms and Conditions to proceed" });

    if (password.length < 6) return res.status(400).json({ message: "Password too short" });

    if (await User.findOne({ email })) return res.status(400).json({ message: "Email exists" });
    if (await User.findOne({ username })) return res.status(400).json({ message: "Username exists" });

    const profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=667eea&color=fff&bold=true&size=200&format=png`;
    const user = new User({ 
      username, 
      email, 
      password, 
      profileImage,
      tncAccepted: true,
      tncAcceptedAt: new Date()
    });
    await user.save();

    // Send welcome email in background (non-blocking)
    sendWelcomeEmail({ to: email, username, role: "user" }).catch(err => {
      console.error("Failed to send welcome email:", err.message);
    });

    const token = generateAuthToken(user._id, "user");

    return res.status(201).json({
      token,
      user: { _id: user._id, username: user.username, email: user.email, profileImage: user.profileImage, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error("User register error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      await logLoginSession(req, null, "user", email, false, "Missing email or password");
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await logLoginSession(req, null, "user", email, false, "User not found");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      await logLoginSession(req, user._id, "user", email, false, "Invalid password");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateAuthToken(user._id, "user");
    
    // Log successful login session
    await logLoginSession(req, user._id, "user", email, true);
    
    return res.status(200).json({
      token,
      user: { _id: user._id, username: user.username, email: user.email, profileImage: user.profileImage, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error("User login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/forgot-password - Request OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    user.resetOTPAttempts = 0;
    await user.save();

    // Send OTP via email
    await sendOTPEmail({
      to: user.email,
      otp,
      userName: user.fullName || user.username,
    });

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/verify-otp - Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check OTP expiry
    if (!user.resetOTPExpiry || new Date() > user.resetOTPExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Check OTP attempts
    if (user.resetOTPAttempts >= 3) {
      user.resetOTP = null;
      user.resetOTPExpiry = null;
      user.resetOTPAttempts = 0;
      await user.save();
      return res.status(400).json({ message: "Too many attempts. Please request a new OTP" });
    }

    // Verify OTP
    if (user.resetOTP !== otp) {
      user.resetOTPAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Generate reset token (short-lived)
    const resetToken = jwt.sign({ userId: user._id, type: "reset" }, process.env.JWT_SECRET, { expiresIn: "15m" });

    return res.status(200).json({ message: "OTP verified", resetToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ message: "Reset token and new password are required" });

    if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired reset token" });
    }

    if (decoded.type !== "reset") return res.status(401).json({ message: "Invalid token type" });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update password
    user.password = newPassword;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    user.resetOTPAttempts = 0;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/auth/me - Get current user (protected route)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token, handle different formats
    let token;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7); // Remove "Bearer " prefix
    } else {
      token = authHeader;
    }

    if (!token || token.trim() === "") {
      console.log("Empty token after parsing");
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenErr) {
      console.error("Token verification failed:", tokenErr.message, "Token:", token.substring(0, 20) + "...");
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.userId).select("-password -resetOTP -resetOTPExpiry");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/auth/me - Update user profile
router.put("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update allowed fields
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.email) user.email = req.body.email;
    if (req.body.username) user.username = req.body.username;

    await user.save();

    return res.status(200).json(user);
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/logout - Log logout session
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenErr) {
      console.error("Token verification error:", tokenErr);
      return res.status(401).json({ message: "Invalid or malformed token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Log logout session with optional device info from client
    const deviceInfo = req.body?.deviceInfo || {};
    await logLogoutSession(decoded.userId, deviceInfo);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/auth/login-history - Get user's login history
router.get("/login-history", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log("No authorization header for login-history");
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token, handle different formats
    let token;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      token = authHeader;
    }

    if (!token || token.trim() === "") {
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenErr) {
      console.error("Token verification failed in login-history:", tokenErr.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const limit = req.query.limit || 50;

    const sessions = await getUserLoginHistory(decoded.userId, parseInt(limit));
    
    console.log("📋 Retrieved", sessions.length, "sessions for user:", decoded.userId);

    return res.status(200).json(sessions);
  } catch (err) {
    console.error("❌ Get login history error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DEBUG: GET /api/auth/debug/latest-sessions - View latest 10 sessions (for testing)
router.get("/debug/latest-sessions", async (req, res) => {
  try {
    const LoginSession = (await import("../models/LoginSession.js")).default;
    const sessions = await LoginSession.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log("🔍 DEBUG: Latest 10 sessions:");
    sessions.forEach((session, idx) => {
      console.log(`\n[${idx + 1}] ${session.email}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Device: ${session.deviceInfo?.deviceName || "Unknown"}`);
      console.log(`   Platform: ${session.deviceInfo?.platform || "Unknown"}`);
      console.log(`   Login: ${session.loginTime}`);
      console.log(`   Logout: ${session.logoutTime}`);
      console.log(`   Duration: ${session.sessionDuration}s`);
    });

    res.status(200).json({
      count: sessions.length,
      sessions: sessions.map((s) => ({
        email: s.email,
        status: s.status,
        device: s.deviceInfo?.deviceName,
        platform: s.deviceInfo?.platform,
        osVersion: s.deviceInfo?.osVersion,
        appVersion: s.deviceInfo?.appVersion,
        ip: s.ipAddress,
        loginTime: s.loginTime,
        logoutTime: s.logoutTime,
        sessionDuration: s.sessionDuration,
      })),
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
