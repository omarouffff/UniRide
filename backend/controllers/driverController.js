const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const { decryptQrPayload } = require('../utils/qrPayload');

const getDriverBookings = asyncHandler(async (req, res) => {
  const filter = { status: 'confirmed' };
  if (req.user.role === 'driver') {
    filter.$or = [{ boardedAt: { $exists: false } }, { boardedAt: null }];
  }

  const bookings = await Booking.find(filter)
    .populate('user', 'name email universityId')
    .populate('trip', 'driver title busNumber departureTime')
    .sort({ travelDate: 1 })
    .lean();

  const driverBookings = req.user.role === 'driver'
    ? bookings.filter((booking) => !booking.trip?.driver || booking.trip.driver.toString() === req.user._id.toString())
    : bookings;

  const mapped = driverBookings.map((booking) => ({
    id: booking._id,
    trip: booking.trip,
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

const scanQr = asyncHandler(async (req, res) => {
  const { qrPayload } = req.body;
  if (!qrPayload) {
    return res.status(400).json({ message: 'QR payload is required' });
  }

  let payload;
  try {
    payload = decryptQrPayload(qrPayload);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid QR code' });
  }

  const booking = await Booking.findOne({
    _id: payload.bookingId,
    user: payload.userId,
    status: 'confirmed',
  }).populate('user', 'name email universityId');

  if (!booking) {
    return res.status(404).json({ message: 'Confirmed booking not found' });
  }

  booking.boardedAt = new Date();
  await booking.save();

  res.json({
    message: 'Passenger boarded successfully',
    booking,
  });
});

const boardPassengerManual = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    status: 'confirmed',
  }).populate('user', 'name email universityId');

  if (!booking) {
    return res.status(404).json({ message: 'Confirmed booking not found' });
  }

  booking.boardedAt = new Date();
  await booking.save();

  res.json({
    message: 'Passenger checked in manually successfully',
    booking,
  });
});

module.exports = { getDriverBookings, scanQr, boardPassengerManual };
