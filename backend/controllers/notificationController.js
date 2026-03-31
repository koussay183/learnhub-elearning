import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.userId, read: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (notificationId === 'all') {
      await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    } else {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId: req.userId },
        { read: true }
      );
    }
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper to create + emit notification
export const createNotification = async (io, userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, data });
    // Emit to the specific user's socket room
    io.to(`user_${userId}`).emit('notification:new', notification);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
