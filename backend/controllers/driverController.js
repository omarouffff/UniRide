const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');

const getDriverBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ status: 'confirmed' })
    .populate('user', 'name email universityId')
    .sort({ travelDate: 1 })
    .lean();

  const mapped = bookings.map((booking) => ({
    id: booking._id,
    route: booking.route,
    pickupPoint: booking.pickupPoint,
    destination: booking.destination,
    travelDate: booking.travelDate,
    seat: booking.seat || null,
    user: booking.user ? {
      id: booking.user._id,
      name: booking.user.name,
      email: booking.user.email,
      universityId: booking.user.universityId,
    } : null,
  }));

  res.json({ bookings: mapped });
});

module.exports = { getDriverBookings };
