const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const { allocateBooking } = require('../services/bookingService');

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
