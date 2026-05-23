const { PrismaClient } = require('@prisma/client');

const prisma = global.prisma || new PrismaClient({ log: ['error', 'warn'] });

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected successfully via Prisma');
  } catch (error) {
    console.error('Prisma database connection error:', error);
    throw error;
  }
}

module.exports = { prisma, connectDatabase };
