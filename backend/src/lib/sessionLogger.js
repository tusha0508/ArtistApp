import LoginSession from "../models/LoginSession.js";

// Extract IP address from request
export const getClientIP = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.connection.remoteAddress;
  return ip || "Unknown";
};

// Log login session
export const logLoginSession = async (req, userId, userRole, email, loginSuccessful = true, failureReason = null) => {
  try {
    const ipAddress = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "Unknown";
    const deviceInfo = req.body?.deviceInfo || {};

    const sessionData = {
      userId,
      userRole,
      email,
      ipAddress,
      deviceInfo: {
        userAgent,
        platform: deviceInfo.platform || "Unknown",
        osVersion: deviceInfo.osVersion || "Unknown",
        appVersion: deviceInfo.appVersion || "Unknown",
        deviceName: deviceInfo.deviceName || "Unknown",
      },
      loginSuccessful,
      failureReason,
      status: loginSuccessful ? "active" : "failed",
    };

    console.log("📝 Logging login session:", {
      email,
      ip: ipAddress,
      successful: loginSuccessful,
      reason: failureReason,
      device: deviceInfo.deviceName || "Unknown",
      platform: deviceInfo.platform || "Unknown",
    });

    const session = new LoginSession(sessionData);
    await session.save();
    
    console.log("✅ Session logged with ID:", session._id);
    return session._id;
  } catch (err) {
    console.error("❌ Error logging login session:", err);
    return null;
  }
};

// Log logout session
export const logLogoutSession = async (userId, deviceInfo = {}) => {
  try {
    const session = await LoginSession.findOne({
      userId,
      status: "active",
    }).sort({ loginTime: -1 });

    if (session) {
      console.log("🔍 Found active session for user:", userId);
      
      session.logoutTime = new Date();
      session.status = "logged_out";
      session.sessionDuration = Math.floor((session.logoutTime - session.loginTime) / 1000); // in seconds
      
      // Update device info if provided from client
      if (deviceInfo && Object.keys(deviceInfo).length > 0) {
        console.log("📱 Updating device info at logout:", deviceInfo);
        session.deviceInfo = {
          ...session.deviceInfo,
          platform: deviceInfo.platform || session.deviceInfo.platform,
          osVersion: deviceInfo.osVersion || session.deviceInfo.osVersion,
          appVersion: deviceInfo.appVersion || session.deviceInfo.appVersion,
          deviceName: deviceInfo.deviceName || session.deviceInfo.deviceName,
        };
      }
      
      await session.save();
      
      console.log("✅ Session closed - Duration:", session.sessionDuration, "seconds");
      return session;
    } else {
      console.log("⚠️ No active session found for user:", userId);
    }
  } catch (err) {
    console.error("❌ Error logging logout session:", err);
  }
};

// Get user login history
export const getUserLoginHistory = async (userId, limit = 20) => {
  try {
    const sessions = await LoginSession.find({ userId })
      .sort({ loginTime: -1 })
      .limit(limit);
    return sessions;
  } catch (err) {
    console.error("Error fetching login history:", err);
    return [];
  }
};

// Get active sessions for a user
export const getActiveSessions = async (userId) => {
  try {
    const sessions = await LoginSession.find({
      userId,
      status: "active",
    });
    return sessions;
  } catch (err) {
    console.error("Error fetching active sessions:", err);
    return [];
  }
};
