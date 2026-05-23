const { prisma } = require('../prisma/client');

const paymentInclude = {
  booking: true,
  user: { select: { id: true, name: true, email: true } },
};

async function findById(id) {
  return prisma.payment.findUnique({ where: { id }, include: paymentInclude });
}

async function findByReference(reference) {
  return prisma.payment.findUnique({ where: { reference }, include: paymentInclude });
}

async function findByUser(userId) {
  return prisma.payment.findMany({
    where: { userId },
    include: paymentInclude,
    orderBy: { createdAt: 'desc' },
  });
}

async function findAll(options = {}) {
  return prisma.payment.findMany({
    include: paymentInclude,
    orderBy: { createdAt: 'desc' },
    ...options,
  });
}

async function create(data) {
  return prisma.payment.create({ data, include: paymentInclude });
}

async function update(id, data) {
  return prisma.payment.update({ where: { id }, data, include: paymentInclude });
}

async function aggregateRevenue(startDate) {
  const [revenue, refunds] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'completed', createdAt: { gte: startDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: 'refunded', createdAt: { gte: startDate } },
      _sum: { amount: true },
    }),
  ]);
  return {
    revenue: Number(revenue._sum.amount || 0),
    count: revenue._count,
    refunds: Number(refunds._sum.amount || 0),
  };
}

module.exports = {
  findById,
  findByReference,
  findByUser,
  findAll,
  create,
  update,
  aggregateRevenue,
};
