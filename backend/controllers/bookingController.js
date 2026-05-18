const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const { allocateBooking } = require('../services/bookingService');
const { getRouteRoomName } = require('../utils/socketRooms');

const createBooking = asyncHandler(async (req, res) => {
  const { pickupPoint, destination, travelDate } = req.body;
  if (!pickupPoint || !destination || !travelDate) {
    return res.status(400).json({ message: 'All booking fields are required' });
  }

  const booking = await allocateBooking({
    user: req.user._id,
    pickupPoint,
    destination,
    travelDate,
  });

  const io = req.app.get('io');
  const bookingPayload = {
    id: booking._id,
    pickupPoint: booking.pickupPoint,
    destination: booking.destination,
    route: booking.route,
    travelDate: booking.travelDate,
    status: booking.status,
    seat: booking.seat || null,
    waitingPosition: booking.waitingPosition || null,
  };

  if (io) {
    io.to(req.user._id.toString()).emit('bookingUpdate', bookingPayload);

    const confirmedCount = await Booking.countDocuments({ travelDate: booking.travelDate, status: 'confirmed' });
    const waitingCount = await Booking.countDocuments({ travelDate: booking.travelDate, status: 'waiting' });
    const routeRoom = getRouteRoomName(booking.route, booking.travelDate);

    if (routeRoom) {
      io.to(routeRoom).emit('routeUpdate', {
        availableSeats: Math.max(0, 40 - confirmedCount),
        confirmedCount,
        waitingCount,
      });
    }
  }

  res.status(201).json({ booking });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).sort('-travelDate');
  res.json({ bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  res.json({ booking });
});

module.exports = { createBooking, getMyBookings, getBookingById };
