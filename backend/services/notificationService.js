const Notification = require('../models/Notification');
const { logger } = require('../utils/logger');

async function createNotification({ userId, type, title, message, metadata = {}, io }) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    metadata,
  });

  const payload = {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  };

  if (io) {
    io.to(userId.toString()).emit('notification', payload);
  }

  return notification;
}

async function notifyBookingConfirmed(userId, booking, io) {
  return createNotification({
    userId,
    type: 'booking_confirmed',
    title: 'Booking confirmed',
    message: `Your trip on ${new Date(booking.travelDate).toLocaleDateString()} is confirmed.`,
    metadata: { bookingId: booking._id?.toString() },
    io,
  });
}

async function notifyWaitingPromoted(userId, booking, io) {
  return createNotification({
    userId,
    type: 'waiting_promoted',
    title: 'Seat available',
    message: 'You were promoted from the waiting list. Your booking is now confirmed.',
    metadata: { bookingId: booking._id?.toString() },
    io,
  });
}

async function notifyPaymentSuccess(userId, payment, io) {
  return createNotification({
    userId,
    type: 'payment_success',
    title: 'Payment received',
    message: `Payment of ${payment.amount} ${payment.currency || 'EGP'} was successful.`,
    metadata: { paymentId: payment._id?.toString() },
    io,
  });
}

async function notifyTripCancelled(userId, booking, io) {
  return createNotification({
    userId,
    type: 'trip_cancelled',
    title: 'Trip cancelled',
    message: `Your booking for ${booking.route || 'your trip'} was cancelled.`,
    metadata: { bookingId: booking._id?.toString() },
    io,
  });
}

async function notifyPasswordChanged(userId, io) {
  return createNotification({
    userId,
    type: 'password_changed',
    title: 'Password changed',
    message: 'Your account password was updated successfully.',
    io,
  });
}

module.exports = {
  createNotification,
  notifyBookingConfirmed,
  notifyWaitingPromoted,
  notifyPaymentSuccess,
  notifyTripCancelled,
  notifyPasswordChanged,
};
