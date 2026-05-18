const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

const DEFAULT_SEAT_CAPACITY = 40;

async function allocateBooking(details) {
  const { user, pickupPoint, destination, travelDate, tripId } = details;
  const trip = tripId ? await Trip.findById(tripId) : null;

  const targetDate = trip ? new Date(trip.departureTime) : new Date(travelDate);
  if (!trip) {
    targetDate.setHours(0, 0, 0, 0);
  }

  const bookingFilter = trip ? { trip: trip._id } : { travelDate: targetDate };
  const existingConfirmed = await Booking.countDocuments({ ...bookingFilter, status: 'confirmed' });
  const bookingsOnTrip = await Booking.find(bookingFilter).sort('createdAt');
  const capacity = trip?.capacity || DEFAULT_SEAT_CAPACITY;

  const booking = new Booking({
    user,
    trip: trip?._id,
    pickupPoint: trip?.pickupPoint || pickupPoint,
    destination: trip?.destination || destination,
    travelDate: targetDate,
    route: trip ? `${trip.pickupPoint} -> ${trip.destination}` : `${pickupPoint} -> ${destination}`,
  });

  if (existingConfirmed < capacity) {
    booking.status = 'confirmed';
    booking.seat = `S-${existingConfirmed + 1}`;
    booking.waitingPosition = null;
  } else {
    booking.status = 'waiting';
    const waitingCount = bookingsOnTrip.filter((item) => item.status === 'waiting').length;
    booking.waitingPosition = waitingCount + 1;
  }

  await booking.save();
  return booking;
}

module.exports = { allocateBooking, DEFAULT_SEAT_CAPACITY };
