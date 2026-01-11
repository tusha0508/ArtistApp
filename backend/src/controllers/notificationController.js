// controllers/notificationController.js
import Notification from "../models/Notification.js";

/**
 * Get all notifications for authenticated user/artist
 */
export const getNotifications = async (req, res) => {
  try {
    const { isRead } = req.query;
    const filter = {
      recipientId: req.user._id,
    };

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(notification);
  } catch (err) {
    console.error("markAsRead error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create notification (internal use)
 */
export const createNotification = async (
  recipientId,
  recipientType,
  type,
  title,
  message,
  bookingId,
  senderId,
  senderName
) => {
  try {
    const notification = await Notification.create({
      recipientId,
      recipientType,
      type,
      title,
      message,
      bookingId,
      senderId,
      senderName,
    });
    return notification;
  } catch (err) {
    console.error("createNotification error:", err);
    throw err;
  }
};
