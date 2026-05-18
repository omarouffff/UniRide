const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const { allocateBooking } = require('../services/bookingService');
const { getRouteRoomName } = require('../utils/socketRooms');

const createBooking = asyncHandler(async (req, res) => {
  const { pickupPoint, destination, travelDate, tripId } = req.body;
  if (!tripId && (!pickupPoint || !destination || !travelDate)) {
    return res.status(400).json({ message: 'Trip or manual booking fields are required' });
  }

  const duplicateFilter = { user: req.user._id, status: { $ne: 'cancelled' } };
  if (tripId) duplicateFilter.trip = tripId;
  const duplicate = await Booking.findOne(duplicateFilter);
  if (duplicate) {
    return res.status(409).json({ message: 'You already have an active booking for this trip' });
  }

  const booking = await allocateBooking({
    user: req.user._id,
    pickupPoint,
    destination,
    travelDate,
    tripId,
  });

  const io = req.app.get('io');
  const bookingPayload = {
    id: booking._id,
    trip: booking.trip,
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

    const filter = booking.trip ? { trip: booking.trip } : { travelDate: booking.travelDate };
    const trip = booking.trip ? await Trip.findById(booking.trip) : null;
    const capacity = trip?.capacity || 40;
    const confirmedCount = await Booking.countDocuments({ ...filter, status: 'confirmed' });
    const waitingCount = await Booking.countDocuments({ ...filter, status: 'waiting' });
    const routeRoom = getRouteRoomName(booking.route, booking.travelDate);

    if (routeRoom) {
      io.to(routeRoom).emit('routeUpdate', {
        tripId: booking.trip,
        availableSeats: Math.max(0, capacity - confirmedCount),
        confirmedCount,
        waitingCount,
      });
    }
  }

  res.status(201).json({ booking });
});

const getAvailableTrips = asyncHandler(async (req, res) => {
  const now = new Date();
  const trips = await Trip.find({ isActive: true, departureTime: { $gte: now } }).sort({ departureTime: 1 }).lean();
  const enrichedTrips = await Promise.all(
    trips.map(async (trip) => {
      const [confirmedCount, waitingCount] = await Promise.all([
        Booking.countDocuments({ trip: trip._id, status: 'confirmed' }),
        Booking.countDocuments({ trip: trip._id, status: 'waiting' }),
      ]);

      return {
        ...trip,
        id: trip._id,
        route: `${trip.pickupPoint} -> ${trip.destination}`,
        confirmedCount,
        waitingCount,
        availableSeats: Math.max(0, trip.capacity - confirmedCount),
      };
    })
  );

  res.json({ trips: enrichedTrips });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate('trip').sort('-travelDate');
  res.json({ bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate('trip');
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  res.json({ booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const deadline = new Date(booking.travelDate).getTime() - 60 * 60 * 1000;
  if (Date.now() > deadline) {
    return res.status(400).json({ message: 'Cancellation deadline has passed' });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  const firstWaiting = await Booking.findOne({ trip: booking.trip, status: 'waiting' }).sort({ createdAt: 1 });
  if (firstWaiting) {
    firstWaiting.status = 'confirmed';
    firstWaiting.seat = booking.seat;
    firstWaiting.waitingPosition = null;
    await firstWaiting.save();
  }

  res.json({ booking });
});

module.exports = { createBooking, getAvailableTrips, getMyBookings, getBookingById, cancelBooking };
