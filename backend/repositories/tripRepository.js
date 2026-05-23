const { prisma } = require('../prisma/client');

const tripInclude = {
  driver: { select: { id: true, name: true, email: true } },
  route: true,
  bus: true,
};

async function findById(id) {
  return prisma.trip.findUnique({ where: { id }, include: tripInclude });
}

async function findActiveUpcoming(fromDate = new Date()) {
  return prisma.trip.findMany({
    where: { isActive: true, departureTime: { gte: fromDate } },
    include: tripInclude,
    orderBy: { departureTime: 'asc' },
  });
}

async function findMany(where = {}, options = {}) {
  return prisma.trip.findMany({
    where,
    include: tripInclude,
    orderBy: { departureTime: 'asc' },
    ...options,
  });
}

async function count(where = {}) {
  return prisma.trip.count({ where });
}

async function create(data) {
  return prisma.trip.create({ data, include: tripInclude });
}

async function update(id, data) {
  return prisma.trip.update({ where: { id }, data, include: tripInclude });
}

async function remove(id) {
  return prisma.trip.delete({ where: { id } });
}

async function incrementConfirmedIfAvailable(tripId, capacity) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.confirmedCount >= capacity) return null;
    return tx.trip.update({
      where: { id: tripId, confirmedCount: { lt: capacity } },
      data: { confirmedCount: { increment: 1 } },
    });
  });
}

async function decrementConfirmed(tripId) {
  return prisma.trip.update({
    where: { id: tripId, confirmedCount: { gt: 0 } },
    data: { confirmedCount: { decrement: 1 } },
  });
}

module.exports = {
  findById,
  findActiveUpcoming,
  findMany,
  count,
  create,
  update,
  remove,
  incrementConfirmedIfAvailable,
  decrementConfirmed,
};
