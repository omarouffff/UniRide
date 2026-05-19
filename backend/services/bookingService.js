const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const { encryptQrPayload } = require('../utils/qrPayload');

const DEFAULT_SEAT_CAPACITY = 40;

async function allocateBooking(details) {
  const { user, pickupPoint, destination, travelDate, tripId } = details;
  const trip = tripId ? await Trip.findById(tripId) : null;

  const targetDate = trip ? new Date(trip.departureTime) : new Date(travelDate);
  if (!trip) {
    targetDate.setHours(0, 0, 0, 0);
  }

  const booking = new Booking({
    user,
    trip: trip?._id,
    pickupPoint: trip?.pickupPoint || pickupPoint,
    destination: trip?.destination || destination,
    travelDate: targetDate,
    route: trip ? `${trip.pickupPoint} -> ${trip.destination}` : `${pickupPoint} -> ${destination}`,
  });

  if (trip) {
    // Optimistic atomic locking for Trip bookings to prevent concurrent overbooking
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: trip._id, confirmedCount: { $lt: trip.capacity } },
      { $inc: { confirmedCount: 1 } },
      { new: true }
    );

    if (updatedTrip) {
      booking.status = 'confirmed';
      booking.seat = `S-${updatedTrip.confirmedCount}`;
      booking.waitingPosition = null;
    } else {
      booking.status = 'waiting';
      const waitingCount = await Booking.countDocuments({ trip: trip._id, status: 'waiting' });
      booking.waitingPosition = waitingCount + 1;
    }
  } else {
    // Fallback for manual bookings not tied to a specific Trip
    const bookingFilter = { travelDate: targetDate };
    const existingConfirmed = await Booking.countDocuments({ ...bookingFilter, status: 'confirmed' });
    const capacity = DEFAULT_SEAT_CAPACITY;

    if (existingConfirmed < capacity) {
      booking.status = 'confirmed';
      booking.seat = `S-${existingConfirmed + 1}`;
      booking.waitingPosition = null;
    } else {
      booking.status = 'waiting';
      const waitingCount = await Booking.countDocuments({ ...bookingFilter, status: 'waiting' });
      booking.waitingPosition = waitingCount + 1;
    }
  }

  await booking.save();

  if (booking.status === 'confirmed') {
    booking.qrPayload = encryptQrPayload({
      bookingId: booking._id,
      userId: booking.user,
      tripId: booking.trip,
      seat: booking.seat,
    });
    await booking.save();
  }

  return booking;
}

module.exports = { allocateBooking, DEFAULT_SEAT_CAPACITY };
