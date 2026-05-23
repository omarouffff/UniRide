const { prisma } = require('../prisma/client');

async function createNotification({ userId, type, title, message, metadata = {}, io }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, metadata },
  });

  const payload = {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  };

  if (io) {
    io.to(userId).emit('notification', payload);
  }

  return notification;
}

async function notifyBookingConfirmed(userId, booking, io) {
  return createNotification({
    userId,
    type: 'booking_confirmed',
    title: 'Booking confirmed',
    message: `Your trip on ${new Date(booking.travelDate).toLocaleDateString()} is confirmed.`,
    metadata: { bookingId: booking.id },
    io,
  });
}

async function notifyWaitingPromoted(userId, booking, io) {
  return createNotification({
    userId,
    type: 'waiting_promoted',
    title: 'Seat available',
    message: 'You were promoted from the waiting list. Your booking is now confirmed.',
    metadata: { bookingId: booking.id },
    io,
  });
}

async function notifyPaymentSuccess(userId, payment, io) {
  return createNotification({
    userId,
    type: 'payment_success',
    title: 'Payment received',
    message: `Payment of ${payment.amount} ${payment.currency || 'EGP'} was successful.`,
    metadata: { paymentId: payment.id },
    io,
  });
}

async function notifyTripCancelled(userId, booking, io) {
  return createNotification({
    userId,
    type: 'trip_cancelled',
    title: 'Trip cancelled',
    message: `Your booking for ${booking.route || 'your trip'} was cancelled.`,
    metadata: { bookingId: booking.id },
    io,
  });
}

module.exports = {
  createNotification,
  notifyBookingConfirmed,
  notifyWaitingPromoted,
  notifyPaymentSuccess,
  notifyTripCancelled,
};
