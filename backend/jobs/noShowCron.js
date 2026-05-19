const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { logger } = require('../utils/logger');

/**
 * Marks confirmed passengers as no-show if trip departed 2+ hours ago and they were not boarded.
 */
async function processNoShows() {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const departedTrips = await Trip.find({
    isActive: true,
    departureTime: { $lte: cutoff },
  }).select('_id');

  const tripIds = departedTrips.map((t) => t._id);
  if (!tripIds.length) return { processed: 0 };

  const bookings = await Booking.find({
    trip: { $in: tripIds },
    status: 'confirmed',
    boardedAt: { $exists: false },
    noShow: { $ne: true },
  });

  let processed = 0;
  for (const booking of bookings) {
    booking.noShow = true;
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    await User.findByIdAndUpdate(booking.user, { $inc: { noShowCount: 1 } });
    processed += 1;
  }

  if (processed > 0) {
    logger.info('No-show cron processed bookings', { processed });
  }

  return { processed };
}

module.exports = { processNoShows };
