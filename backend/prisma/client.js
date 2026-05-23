const { PrismaClient } = require('@prisma/client');
const { configureDatabaseEnv } = require('../config/database');

// Ensure DATABASE_URL / DIRECT_DATABASE_URL are normalized before Prisma connects
configureDatabaseEnv();

const logLevels =
  process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn', 'info'];

const prisma =
  global.prisma ||
  new PrismaClient({
    log: logLevels,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

async function connectDatabase() {
  const maxAttempts = Number(process.env.DB_CONNECT_RETRIES || 5);
  const delayMs = Number(process.env.DB_CONNECT_RETRY_MS || 3000);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('PostgreSQL connected successfully via Prisma');
      return;
    } catch (error) {
      const code = error.code || error.errorCode;
      console.error(`Prisma database connection error (attempt ${attempt}/${maxAttempts}):`, {
        code,
        message: error.message,
      });

      if (attempt === maxAttempts) {
        if (code === 'P1001') {
          console.error(
            'P1001: Cannot reach database. Check DATABASE_URL host, Supabase project status, and IP allowlist (use pooler or disable IPv4 restriction).'
          );
        }
        if (code === 'P1013') {
          console.error(
            'P1013: Invalid connection string. For Supabase pooler use username postgres.<project-ref>, not "postgres".'
          );
        }
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { prisma, connectDatabase };
