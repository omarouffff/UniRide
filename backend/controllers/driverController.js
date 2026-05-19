const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { decryptQrPayload } = require('../utils/qrPayload');

const getDriverBookings = asyncHandler(async (req, res) => {
  const filter = {
    status: 'confirmed',
    $or: [{ boardedAt: { $exists: false } }, { boardedAt: null }],
  };

  if (req.user.role === 'driver') {
    const driverTrips = await Trip.find({ driver: req.user._id, isActive: true }).select('_id').lean();
    const tripIds = driverTrips.map((t) => t._id);
    filter.trip = { $in: tripIds };
  }

  const bookings = await Booking.find(filter)
    .populate('user', 'name email universityId')
    .populate('trip', 'driver title busNumber departureTime pickupPoint destination')
    .sort({ travelDate: 1 })
    .lean();

  const mapped = bookings.map((booking) => ({
    id: booking._id,
    trip: booking.trip,
    route: booking.route,
    pickupPoint: booking.pickupPoint,
    destination: booking.destination,
    travelDate: booking.travelDate,
    seat: booking.seat || null,
    user: booking.user
      ? {
          id: booking.user._id,
          name: booking.user.name,
          email: booking.user.email,
          universityId: booking.user.universityId,
        }
      : null,
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
  }).populate('trip').populate('user', 'name email universityId');

  if (!booking) {
    return res.status(404).json({ message: 'Confirmed booking not found' });
  }

  if (req.user.role === 'driver' && booking.trip?.driver?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to board passengers for this trip' });
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
  }).populate('trip').populate('user', 'name email universityId');

  if (!booking) {
    return res.status(404).json({ message: 'Confirmed booking not found' });
  }

  if (req.user.role === 'driver' && booking.trip?.driver?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to board passengers for this trip' });
  }

  booking.boardedAt = new Date();
  await booking.save();

  res.json({
    message: 'Passenger checked in manually successfully',
    booking,
  });
});

const markNoShow = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ message: 'Booking ID is required' });
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    status: 'confirmed',
    boardedAt: { $exists: false },
  }).populate('trip').populate('user', 'name email');

  if (!booking) {
    return res.status(404).json({ message: 'Eligible booking not found' });
  }

  if (req.user.role === 'driver' && booking.trip?.driver?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized for this trip' });
  }

  booking.noShow = true;
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  if (booking.user) {
    await User.findByIdAndUpdate(booking.user._id, { $inc: { noShowCount: 1 } });
  }

  res.json({ message: 'Passenger marked as no-show', booking });
});

module.exports = { getDriverBookings, scanQr, boardPassengerManual, markNoShow };
