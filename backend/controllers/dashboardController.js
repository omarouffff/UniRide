const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const bookingRepository = require('../repositories/bookingRepository');
const { DEFAULT_SEAT_CAPACITY } = require('../services/bookingService');

const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBooking = await bookingRepository.findUpcomingByUser(user.id, today);

  const dateFilter = upcomingBooking?.travelDate || today;
  const [confirmedCount, waitingCount] = await Promise.all([
    bookingRepository.count({ travelDate: dateFilter, status: 'confirmed' }),
    bookingRepository.count({ travelDate: dateFilter, status: 'waiting' }),
  ]);

  let qrCode = null;
  if (upcomingBooking?.status === 'confirmed' && upcomingBooking.qrPayload) {
    qrCode = await QRCode.toDataURL(upcomingBooking.qrPayload);
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      universityIdStatus: user.universityIdStatus,
      noShowCount: user.noShowCount || 0,
      waitingListPosition: user.waitingListPosition ?? null,
    },
    upcomingBooking: upcomingBooking
      ? {
          id: upcomingBooking.id,
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
