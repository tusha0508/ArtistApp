// routes/artistAuthRoutes.js
import express from "express";
import Artist from "../models/Artist.js";
import jwt from "jsonwebtoken";
import { sendOTPEmail, sendWelcomeEmail } from "../services/emailService.js";
import { logLoginSession, logLogoutSession, getUserLoginHistory } from "../lib/sessionLogger.js";

const router = express.Router();

const generateAuthToken = (userId, role = "artist") => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/artists/register
router.post("/register", async (req, res) => {
  try {
    const { email, username, password, fullName, city, dob, skills, tncAccepted } = req.body;
    if (!email || !username || !password || !fullName || !city || !dob) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (!tncAccepted) return res.status(400).json({ message: "You must accept Terms and Conditions to proceed" });

    if (password.length < 6) return res.status(400).json({ message: "Password too short" });

    const existingEmail = await Artist.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const existingUsername = await Artist.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Username already exists" });

    const profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=667eea&color=fff&bold=true&size=200&format=png`;
    const normalizedSkills = Array.isArray(skills)
      ? skills.map((s) => s.trim()).filter(Boolean)
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const artist = new Artist({ 
      email, 
      username, 
      password, 
      fullName, 
      city, 
      dob, 
      profileImage, 
      skills: normalizedSkills,
      tncAccepted: true,
      tncAcceptedAt: new Date()
    });
    await artist.save();

    // Send welcome email
    await sendWelcomeEmail({ to: email, username, role: "artist" });

    const token = generateAuthToken(artist._id, "artist");
    res.status(201).json({
      token,
        artist: {
        _id: artist._id,
        username: artist.username,
        email: artist.email,
        profileImage: artist.profileImage,
        fullName: artist.fullName,
        skills: artist.skills,
        city: artist.city,
        dob: artist.dob,
        createdAt: artist.createdAt,
      },
    });
  } catch (err) {
    console.error("Artist register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/artists/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      // Log failed login attempt - missing credentials
      await logLoginSession(req, null, "artist", email || "unknown", false, "Missing credentials");
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const artist = await Artist.findOne({ email });
    if (!artist) {
      // Log failed login attempt - artist not found
      await logLoginSession(req, null, "artist", email, false, "Artist not found");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const valid = await artist.comparePassword(password);
    if (!valid) {
      // Log failed login attempt - invalid password
      await logLoginSession(req, artist._id, "artist", email, false, "Invalid password");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Log successful login
    await logLoginSession(req, artist._id, "artist", email, true);

    const token = generateAuthToken(artist._id, "artist");
    res.status(200).json({
      token,
      artist: {
        _id: artist._id,
        username: artist.username,
        email: artist.email,
        profileImage: artist.profileImage,
        fullName: artist.fullName,
        skills: artist.skills,
        city: artist.city,
        dob: artist.dob,
        createdAt: artist.createdAt,
      },
    });
  } catch (err) {
    console.error("Artist login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/artists/forgot-password - Request OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const artist = await Artist.findOne({ email });
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update artist with OTP
    artist.resetOTP = otp;
    artist.resetOTPExpiry = otpExpiry;
    artist.resetOTPAttempts = 0;
    await artist.save();

    // Send OTP via email
    await sendOTPEmail({
      to: artist.email,
      otp,
      userName: artist.fullName,
    });

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/artists/verify-otp - Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const artist = await Artist.findOne({ email });
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    // Check OTP expiry
    if (!artist.resetOTPExpiry || new Date() > artist.resetOTPExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Check OTP attempts
    if (artist.resetOTPAttempts >= 3) {
      artist.resetOTP = null;
      artist.resetOTPExpiry = null;
      artist.resetOTPAttempts = 0;
      await artist.save();
      return res.status(400).json({ message: "Too many attempts. Please request a new OTP" });
    }

    // Verify OTP
    if (artist.resetOTP !== otp) {
      artist.resetOTPAttempts += 1;
      await artist.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Generate reset token (short-lived)
    const resetToken = jwt.sign({ userId: artist._id, type: "reset" }, process.env.JWT_SECRET, { expiresIn: "15m" });

    return res.status(200).json({ message: "OTP verified", resetToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/artists/reset-password - Reset password with token
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

    const artist = await Artist.findById(decoded.userId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    // Update password
    artist.password = newPassword;
    artist.resetOTP = null;
    artist.resetOTPExpiry = null;
    artist.resetOTPAttempts = 0;
    await artist.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/artists/logout - Log out and close session
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token is required" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenErr) {
      console.error("Token verification error:", tokenErr);
      return res.status(401).json({ message: "Invalid or malformed token" });
    }

    // Log logout session with optional device info from client
    const deviceInfo = req.body?.deviceInfo || {};
    await logLogoutSession(decoded.userId, deviceInfo);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/artists/login-history - Get user's login history
router.get("/login-history", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token is required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const limit = req.query.limit || 50;

    const sessions = await getUserLoginHistory(decoded.userId, parseInt(limit));
    res.status(200).json({ sessions });
  } catch (err) {
    console.error("Login history error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
