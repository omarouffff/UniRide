const asyncHandler = require('express-async-handler');
const { prisma } = require('../prisma/client');

const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, limit = 50, page = 1 } = req.query;
  const where = { userId: req.user.id };
  if (unreadOnly === 'true') where.read = false;

  const take = Math.min(Number(limit), 100);
  const skip = (Math.max(Number(page), 1) - 1) * take;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, read: false } }),
  ]);

  res.json({
    notifications,
    total,
    unreadCount,
    page: Number(page),
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { read: true },
  });
  if (!notification.count) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ notification: { id: req.params.id, read: true } });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  res.json({ message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const result = await prisma.notification.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!result.count) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ message: 'Notification deleted' });
});

const createComplaint = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }
  const complaint = await prisma.complaint.create({
    data: { userId: req.user.id, subject, message },
  });
  res.status(201).json({ complaint });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createComplaint,
};
