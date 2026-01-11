// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Artist from "../models/Artist.js";

/**
 * protectRoute - verify token and attach user/artist to req.user
 * optionally pass an array of allowed roles to restrict access
 * usage: protectRoute(['artist']) or protectRoute(['user', 'admin'])
 */
export const protectRoute = (allowedRoles = []) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Expect decoded to be { userId, role } (we standardize on that)
    const { userId, role } = decoded;

    // find either user or artist depending on role
    let account = null;
    if (role === "artist") {
      account = await Artist.findById(userId).select("-password");
    } else {
      account = await User.findById(userId).select("-password");
    }

    if (!account) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    // role check if allowedRoles provided
    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }
    }

    req.user = account; // attach found account
    req.user.role = role; // attach role for convenience
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

export default protectRoute;
