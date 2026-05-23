const { prisma } = require('../prisma/client');
const tripRepository = require('../repositories/tripRepository');
const bookingRepository = require('../repositories/bookingRepository');
const { encryptQrPayload } = require('../utils/qrPayload');

const DEFAULT_SEAT_CAPACITY = 40;

async function allocateBooking(details) {
  const { userId, pickupPoint, destination, travelDate, tripId } = details;
  const trip = tripId ? await tripRepository.findById(tripId) : null;

  const targetDate = trip ? new Date(trip.departureTime) : new Date(travelDate);
  if (!trip) {
    targetDate.setHours(0, 0, 0, 0);
  }

  const routeLabel = trip
    ? `${trip.pickupPoint} -> ${trip.destination}`
    : `${pickupPoint} -> ${destination}`;

  return prisma.$transaction(async (tx) => {
    let status = 'waiting';
    let seat = null;
    let waitingPosition = null;
    let qrPayload = null;

    if (trip) {
      const updatedTrip = await tx.trip.updateMany({
        where: { id: trip.id, confirmedCount: { lt: trip.capacity } },
        data: { confirmedCount: { increment: 1 } },
      });

      if (updatedTrip.count > 0) {
        const refreshed = await tx.trip.findUnique({ where: { id: trip.id } });
        status = 'confirmed';
        seat = `S-${refreshed.confirmedCount}`;
      } else {
        const waitingCount = await tx.booking.count({
          where: { tripId: trip.id, status: 'waiting' },
        });
        waitingPosition = waitingCount + 1;
      }
    } else {
      const confirmedCount = await tx.booking.count({
        where: {
          travelDate: targetDate,
          status: 'confirmed',
        },
      });
      const capacity = DEFAULT_SEAT_CAPACITY;
      if (confirmedCount < capacity) {
        status = 'confirmed';
        seat = `S-${confirmedCount + 1}`;
      } else {
        const waitingCount = await tx.booking.count({
          where: { travelDate: targetDate, status: 'waiting' },
        });
        waitingPosition = waitingCount + 1;
      }
    }

    const booking = await tx.booking.create({
      data: {
        userId,
        tripId: trip?.id,
        pickupPoint: trip?.pickupPoint || pickupPoint,
        destination: trip?.destination || destination,
        travelDate: targetDate,
        route: routeLabel,
        status,
        seat,
        waitingPosition,
      },
      include: {
        trip: { include: { driver: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (status === 'confirmed') {
      qrPayload = encryptQrPayload({
        bookingId: booking.id,
        userId: booking.userId,
        tripId: booking.tripId,
        seat,
      });
      return tx.booking.update({
        where: { id: booking.id },
        data: { qrPayload },
        include: {
          trip: { include: { driver: { select: { id: true, name: true, email: true } } } },
        },
      });
    }

    if (waitingPosition && trip) {
      await tx.waitingList.create({
        data: {
          bookingId: booking.id,
          tripId: trip.id,
          position: waitingPosition,
        },
      });
    }

    return booking;
  });
}

module.exports = { allocateBooking, DEFAULT_SEAT_CAPACITY };
