const { prisma } = require('../prisma/client');
const { logger } = require('../utils/logger');

async function processNoShows() {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const overdue = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      boardedAt: null,
      travelDate: { lte: cutoff },
    },
    take: 100,
  });

  for (const booking of overdue) {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { noShow: true, status: 'cancelled', cancelledAt: new Date() },
      }),
      prisma.user.update({
        where: { id: booking.userId },
        data: { noShowCount: { increment: 1 } },
      }),
    ]);
  }

  if (overdue.length > 0) {
    logger.info('No-show cron processed bookings', { count: overdue.length });
  }
}

module.exports = { processNoShows };
