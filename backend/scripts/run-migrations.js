#!/usr/bin/env node
/**
 * Runs `prisma migrate deploy` using DIRECT_DATABASE_URL (via schema directUrl).
 * Retries on transient Supabase/network failures during Railway deploy.
 */
const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();

const { configureDatabaseEnv, maskUrl } = require('../config/database');

const maxAttempts = Number(process.env.MIGRATE_RETRIES || 6);
const delayMs = Number(process.env.MIGRATE_RETRY_MS || 10000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = configureDatabaseEnv();
  if (!config.ok) {
    console.error('[UniRide] Database env invalid:', config.error);
    process.exit(1);
  }

  console.info('[UniRide] Runtime DATABASE_URL:', maskUrl(process.env.DATABASE_URL));
  console.info('[UniRide] Migration DIRECT_DATABASE_URL:', maskUrl(process.env.DIRECT_DATABASE_URL));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.info(`[UniRide] prisma migrate deploy (attempt ${attempt}/${maxAttempts})`);
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env,
      });
      console.info('[UniRide] Migrations applied successfully');
      process.exit(0);
    } catch (error) {
      console.error(`[UniRide] Migration attempt ${attempt} failed`);
      if (attempt >= maxAttempts) {
        console.error('[UniRide] All migration attempts exhausted');
        process.exit(1);
      }
      console.info(`[UniRide] Retrying in ${delayMs / 1000}s...`);
      await sleep(delayMs);
    }
  }
}

main().catch((error) => {
  console.error('[UniRide] Migration runner error:', error.message);
  process.exit(1);
});
