const { prisma } = require('../prisma/client');

const bookingInclude = {
  trip: {
    include: {
      driver: { select: { id: true, name: true, email: true } },
    },
  },
  user: { select: { id: true, name: true, email: true, universityId: true } },
};

async function findById(id) {
  return prisma.booking.findUnique({ where: { id }, include: bookingInclude });
}

async function findByUserAndId(userId, id) {
  return prisma.booking.findFirst({ where: { id, userId }, include: bookingInclude });
}

async function findActiveByUserAndTrip(userId, tripId) {
  return prisma.booking.findFirst({
    where: {
      userId,
      tripId,
      status: { not: 'cancelled' },
    },
  });
}

async function findManyByUser(userId) {
  return prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { travelDate: 'desc' },
  });
}

async function findUpcomingByUser(userId, fromDate) {
  return prisma.booking.findFirst({
    where: {
      userId,
      travelDate: { gte: fromDate },
      status: { not: 'cancelled' },
    },
    orderBy: { travelDate: 'asc' },
    include: bookingInclude,
  });
}

async function count(where) {
  return prisma.booking.count({ where });
}

async function create(data) {
  return prisma.booking.create({ data, include: bookingInclude });
}

async function update(id, data) {
  return prisma.booking.update({ where: { id }, data, include: bookingInclude });
}

async function findMany(where = {}, options = {}) {
  return prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
    ...options,
  });
}

async function findFirstWaiting(tripId) {
  return prisma.booking.findFirst({
    where: { tripId, status: 'waiting' },
    orderBy: { createdAt: 'asc' },
  });
}

module.exports = {
  findById,
  findByUserAndId,
  findActiveByUserAndTrip,
  findManyByUser,
  findUpcomingByUser,
  count,
  create,
  update,
  findMany,
  findFirstWaiting,
  bookingInclude,
};
