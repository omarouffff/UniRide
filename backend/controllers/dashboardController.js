const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const DEFAULT_SEAT_CAPACITY = 40;

const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBooking = await Booking.findOne({
    user: user._id,
    travelDate: { $gte: today },
  })
    .sort('travelDate')
    .lean();

  const routeDate = upcomingBooking ? new Date(upcomingBooking.travelDate).toISOString().slice(0, 10) : today.toISOString().slice(0, 10);
  const confirmedCount = upcomingBooking
    ? await Booking.countDocuments({ travelDate: upcomingBooking.travelDate, status: 'confirmed' })
    : await Booking.countDocuments({ travelDate: today, status: 'confirmed' });
  const waitingCount = upcomingBooking
    ? await Booking.countDocuments({ travelDate: upcomingBooking.travelDate, status: 'waiting' })
    : await Booking.countDocuments({ travelDate: today, status: 'waiting' });

  let qrCode = null;

  if (upcomingBooking && upcomingBooking.status === 'confirmed') {
    qrCode = await QRCode.toDataURL(upcomingBooking.qrPayload);
  }

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      universityIdStatus: user.status,
      noShowCount: user.noShowCount || 0,
      waitingListPosition: user.waitingListPosition ?? null,
    },
    upcomingBooking: upcomingBooking
      ? {
          id: upcomingBooking._id,
          pickupPoint: upcomingBooking.pickupPoint,
          destination: upcomingBooking.destination,
          route: upcomingBooking.route,
          travelDate: upcomingBooking.travelDate,
          status: upcomingBooking.status,
          seat: upcomingBooking.seat || null,
          waitingPosition: upcomingBooking.waitingPosition || null,
          qrCode,
          qrPayload: upcomingBooking.qrPayload,
        }
      : null,
    totalSeats: DEFAULT_SEAT_CAPACITY,
    availableSeats: Math.max(0, DEFAULT_SEAT_CAPACITY - confirmedCount),
    confirmedCount,
    waitingCount,
  });
});

module.exports = { getDashboard };
