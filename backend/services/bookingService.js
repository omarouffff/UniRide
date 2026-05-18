const Booking = require('../models/Booking');

const DEFAULT_SEAT_CAPACITY = 40;

async function allocateBooking(details) {
  const { user, pickupPoint, destination, travelDate } = details;

  const targetDate = new Date(travelDate);
  targetDate.setHours(0, 0, 0, 0);

  const existingConfirmed = await Booking.countDocuments({ travelDate: targetDate, status: 'confirmed' });
  const bookingsOnDate = await Booking.find({ travelDate: targetDate }).sort('createdAt');

  const booking = new Booking({
    user,
    pickupPoint,
    destination,
    travelDate: targetDate,
    route: `${pickupPoint} → ${destination}`,
  });

  if (existingConfirmed < DEFAULT_SEAT_CAPACITY) {
    booking.status = 'confirmed';
    booking.seat = `S-${existingConfirmed + 1}`;
    booking.waitingPosition = null;
  } else {
    booking.status = 'waiting';
    const waitingCount = bookingsOnDate.filter((item) => item.status === 'waiting').length;
    booking.waitingPosition = waitingCount + 1;
  }

  await booking.save();
  return booking;
}

module.exports = { allocateBooking };
