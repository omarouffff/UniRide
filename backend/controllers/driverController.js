const asyncHandler = require('express-async-handler');
const { prisma } = require('../prisma/client');
const bookingRepository = require('../repositories/bookingRepository');
const userRepository = require('../repositories/userRepository');
const { decryptQrPayload } = require('../utils/qrPayload');

const getDriverBookings = asyncHandler(async (req, res) => {
  const where = {
    status: 'confirmed',
    boardedAt: null,
  };

  if (req.user.role === 'driver') {
    const driverTrips = await prisma.trip.findMany({
      where: { driverId: req.user.id, isActive: true },
      select: { id: true },
    });
    where.tripId = { in: driverTrips.map((t) => t.id) };
  }

  const bookings = await bookingRepository.findMany(where, { orderBy: { travelDate: 'asc' } });
  const mapped = bookings.map((booking) => ({
    id: booking.id,
    trip: booking.trip,
    route: booking.route,
    pickupPoint: booking.pickupPoint,
    destination: booking.destination,
    travelDate: booking.travelDate,
    seat: booking.seat || null,
    user: booking.user
      ? {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
          universityId: booking.user.universityId,
        }
      : null,
  }));
  res.json({ bookings: mapped });
});

async function boardBooking(booking, req, location) {
  if (req.user.role === 'driver' && booking.trip?.driverId !== req.user.id) {
    const error = new Error('Not authorized to board passengers for this trip');
    error.statusCode = 403;
    throw error;
  }

  const existingScan = await prisma.qrScan.findFirst({
    where: { bookingId: booking.id },
  });
  if (existingScan) {
    const error = new Error('Passenger already boarded');
    error.statusCode = 409;
    throw error;
  }

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { boardedAt: new Date() },
      include: {
        trip: true,
        user: { select: { id: true, name: true, email: true, universityId: true } },
      },
    }),
    prisma.qrScan.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        location: location || null,
        metadata: { driverId: req.user.id },
      },
    }),
  ]);

  const io = req.app.get('io');
  if (io) {
    io.to(booking.userId).emit('boardingUpdate', {
      bookingId: booking.id,
      status: 'boarded',
      boardedAt: updated.boardedAt,
    });
  }

  return updated;
}

const scanQr = asyncHandler(async (req, res) => {
  const { qrPayload } = req.body;
  if (!qrPayload) return res.status(400).json({ message: 'QR payload is required' });

  let payload;
  try {
    payload = decryptQrPayload(qrPayload);
  } catch {
    return res.status(400).json({ message: 'Invalid QR code' });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: payload.bookingId,
      userId: payload.userId,
      status: 'confirmed',
    },
    include: {
      trip: true,
      user: { select: { id: true, name: true, email: true, universityId: true } },
    },
  });

  if (!booking) return res.status(404).json({ message: 'Confirmed booking not found' });

  const updated = await boardBooking(booking, req, req.body.location);
  res.json({ message: 'Passenger boarded successfully', booking: updated });
});

const boardPassengerManual = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ message: 'Booking ID is required' });

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, status: 'confirmed' },
    include: {
      trip: true,
      user: { select: { id: true, name: true, email: true, universityId: true } },
    },
  });
  if (!booking) return res.status(404).json({ message: 'Confirmed booking not found' });

  const updated = await boardBooking(booking, req);
  res.json({ message: 'Passenger checked in manually successfully', booking: updated });
});

const markNoShow = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ message: 'Booking ID is required' });

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, status: 'confirmed', boardedAt: null },
    include: { trip: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!booking) return res.status(404).json({ message: 'Eligible booking not found' });

  if (req.user.role === 'driver' && booking.trip?.driverId !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized for this trip' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id: booking.id },
      data: { noShow: true, status: 'cancelled', cancelledAt: new Date() },
    });
    if (booking.userId) {
      await tx.user.update({
        where: { id: booking.userId },
        data: { noShowCount: { increment: 1 } },
      });
    }
    return result;
  });

  res.json({ message: 'Passenger marked as no-show', booking: updated });
});

const updateDriverLocation = asyncHandler(async (req, res) => {
  const { lat, lng, tripId } = req.body;
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  const io = req.app.get('io');
  if (io && tripId) {
    io.to(`trip:${tripId}`).emit('driverLocation', {
      driverId: req.user.id,
      lat: Number(lat),
      lng: Number(lng),
      updatedAt: new Date().toISOString(),
    });
  }

  res.json({ message: 'Location updated' });
});

module.exports = {
  getDriverBookings,
  scanQr,
  boardPassengerManual,
  markNoShow,
  updateDriverLocation,
};
