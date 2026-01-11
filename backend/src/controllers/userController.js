// controllers/userController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const getMe = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) delete updates.password; // don't allow here

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    return res.status(200).json(updated);
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Provide current and new password" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password too short" });

    const user = await User.findById(req.user._id);
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password incorrect" });

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.status(200).json({ message: "User account deleted" });
  } catch (err) {
    console.error("deleteMe error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// lightweight token refresh (dev): reissue token with same payload
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role } = decoded;
    const newToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "15d" });
    return res.status(200).json({ token: newToken });
  } catch (err) {
    console.error("refreshToken error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
