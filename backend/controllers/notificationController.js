const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, limit = 50, page = 1 } = req.query;
  const filter = { user: req.user._id };
  if (unreadOnly === 'true') filter.read = false;

  const skip = (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Math.min(Number(limit), 100)).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({
    notifications: notifications.map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      metadata: n.metadata,
      createdAt: n.createdAt,
    })),
    total,
    unreadCount,
    page: Number(page),
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ notification: { id: notification._id, read: notification.read } });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ message: 'Notification deleted' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
