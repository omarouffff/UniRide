const asyncHandler = require('express-async-handler');
const bookingRepository = require('../repositories/bookingRepository');
const tripRepository = require('../repositories/tripRepository');
const { allocateBooking } = require('../services/bookingService');
const { getRouteRoomName } = require('../utils/socketRooms');
const { prisma } = require('../prisma/client');
const { encryptQrPayload } = require('../utils/qrPayload');

const createBooking = asyncHandler(async (req, res) => {
  const { pickupPoint, destination, travelDate, tripId } = req.body;
  if (!tripId && (!pickupPoint || !destination || !travelDate)) {
    return res.status(400).json({ message: 'Trip or manual booking fields are required' });
  }

  const duplicate = tripId
    ? await bookingRepository.findActiveByUserAndTrip(req.user.id, tripId)
    : null;
  if (duplicate) {
    return res.status(409).json({ message: 'You already have an active booking for this trip' });
  }

  const booking = await allocateBooking({
    userId: req.user.id,
    pickupPoint,
    destination,
    travelDate,
    tripId,
  });

  const io = req.app.get('io');
  const bookingPayload = {
    id: booking.id,
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
    io.to(req.user.id).emit('bookingUpdate', bookingPayload);

    const trip = booking.tripId ? await tripRepository.findById(booking.tripId) : null;
    const capacity = trip?.capacity || 40;
    const filter = booking.tripId ? { tripId: booking.tripId } : { travelDate: booking.travelDate };
    const [confirmedCount, waitingCount] = await Promise.all([
      bookingRepository.count({ ...filter, status: 'confirmed' }),
      bookingRepository.count({ ...filter, status: 'waiting' }),
    ]);
    const routeRoom = getRouteRoomName(booking.route, booking.travelDate);

    if (routeRoom) {
      io.to(routeRoom).emit('routeUpdate', {
        tripId: booking.tripId,
        availableSeats: Math.max(0, capacity - confirmedCount),
        confirmedCount,
        waitingCount,
      });
    }
  }

  res.status(201).json({ booking });
});

const getAvailableTrips = asyncHandler(async (req, res) => {
  const trips = await tripRepository.findActiveUpcoming();
  const enrichedTrips = await Promise.all(
    trips.map(async (trip) => {
      const [confirmedCount, waitingCount] = await Promise.all([
        bookingRepository.count({ tripId: trip.id, status: 'confirmed' }),
        bookingRepository.count({ tripId: trip.id, status: 'waiting' }),
      ]);
      return {
        ...trip,
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
  const bookings = await bookingRepository.findManyByUser(req.user.id);
  res.json({ bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingRepository.findByUserAndId(req.user.id, req.params.id);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  res.json({ booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingRepository.findByUserAndId(req.user.id, req.params.id);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const deadline = new Date(booking.travelDate).getTime() - 60 * 60 * 1000;
  if (Date.now() > deadline) {
    return res.status(400).json({ message: 'Cancellation deadline has passed' });
  }

  const wasConfirmed = booking.status === 'confirmed';
  const cancelledPosition = booking.waitingPosition;

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        waitingPosition: null,
      },
    });

    if (wasConfirmed && booking.tripId) {
      const firstWaiting = await tx.booking.findFirst({
        where: { tripId: booking.tripId, status: 'waiting' },
        orderBy: { createdAt: 'asc' },
      });

      if (firstWaiting) {
        const qrPayload = encryptQrPayload({
          bookingId: firstWaiting.id,
          userId: firstWaiting.userId,
          tripId: firstWaiting.tripId,
          seat: booking.seat,
        });
        await tx.booking.update({
          where: { id: firstWaiting.id },
          data: {
            status: 'confirmed',
            seat: booking.seat,
            waitingPosition: null,
            qrPayload,
          },
        });
        await tx.booking.updateMany({
          where: { tripId: booking.tripId, status: 'waiting' },
          data: { waitingPosition: { decrement: 1 } },
        });
        await tx.waitingList.deleteMany({ where: { bookingId: firstWaiting.id } });
      } else {
        await tx.trip.updateMany({
          where: { id: booking.tripId, confirmedCount: { gt: 0 } },
          data: { confirmedCount: { decrement: 1 } },
        });
      }
    } else if (cancelledPosition && booking.tripId) {
      await tx.booking.updateMany({
        where: {
          tripId: booking.tripId,
          status: 'waiting',
          waitingPosition: { gt: cancelledPosition },
        },
        data: { waitingPosition: { decrement: 1 } },
      });
      await tx.waitingList.deleteMany({ where: { bookingId: booking.id } });
    }

    return cancelled;
  });

  res.json({ booking: updated });
});

module.exports = { createBooking, getAvailableTrips, getMyBookings, getBookingById, cancelBooking };
