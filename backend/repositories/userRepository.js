const { prisma } = require('../prisma/client');

const userSelect = {
  id: true,
  supabaseId: true,
  name: true,
  email: true,
  phoneNumber: true,
  college: true,
  academicYear: true,
  profileImage: true,
  role: true,
  status: true,
  universityId: true,
  idCardImage: true,
  universityIdImage: true,
  universityIdStatus: true,
  reviewedAt: true,
  reviewNotes: true,
  noShowCount: true,
  waitingListPosition: true,
  isActive: true,
  emailVerified: true,
  twoFactorEnabled: true,
  createdAt: true,
  updatedAt: true,
};

async function findById(id) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: userSelect });
}

async function findBySupabaseId(supabaseId) {
  return prisma.user.findUnique({ where: { supabaseId }, select: userSelect });
}

async function findMany(where = {}, options = {}) {
  return prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: { createdAt: 'desc' },
    ...options,
  });
}

async function create(data) {
  return prisma.user.create({ data, select: userSelect });
}

async function update(id, data) {
  return prisma.user.update({ where: { id }, data, select: userSelect });
}

async function remove(id) {
  return prisma.user.delete({ where: { id } });
}

async function count(where = {}) {
  return prisma.user.count({ where });
}

module.exports = {
  findById,
  findByEmail,
  findBySupabaseId,
  findMany,
  create,
  update,
  remove,
  count,
};
