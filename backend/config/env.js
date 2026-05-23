const { logger } = require('../utils/logger');
const { configureDatabaseEnv, validateDatabaseEnvForProduction, maskUrl } = require('./database');

const REQUIRED_ENV_VARS = ['DATABASE_URL'];

const PRODUCTION_REQUIRED = [
  'QR_ENCRYPTION_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const OPTIONAL_ENV_VARS = [
  'PAYMOB_API_KEY',
  'PAYMOB_HMAC_SECRET',
  'PAYMOB_INTEGRATION_ID',
  'PAYMOB_IFRAME_ID',
  'FAWRY_MERCHANT_CODE',
  'FAWRY_SECURITY_KEY',
  'STRIPE_SECRET_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'REDIS_URL',
];

const PLACEHOLDER_PATTERNS = ['replace-with', 'your-', 'changeme'];

function isPlaceholder(value) {
  if (!value || typeof value !== 'string') return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p)) || value.length < 16;
}

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar] || isPlaceholder(process.env[envVar]));

  if (missing.length > 0) {
    logger.error('CRITICAL: Missing environment variables', { missing });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const dbConfig = configureDatabaseEnv();
  if (!dbConfig.ok) {
    logger.error('DATABASE_URL configuration error', { error: dbConfig.error });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else if (dbConfig.hints?.length) {
    logger.info('Database connection', {
      mode: dbConfig.mode,
      databaseUrl: maskUrl(process.env.DATABASE_URL),
      directUrl: maskUrl(process.env.DIRECT_DATABASE_URL),
      hints: dbConfig.hints,
    });
  }

  if (process.env.NODE_ENV === 'production') {
    const dbProd = validateDatabaseEnvForProduction();
    if (!dbProd.ok) {
      logger.error('Production database validation failed', { error: dbProd.error });
      process.exit(1);
    }
    const prodMissing = PRODUCTION_REQUIRED.filter((key) => !process.env[key] || isPlaceholder(process.env[key]));
    if (prodMissing.length > 0) {
      logger.error('Production requires additional env vars', { prodMissing });
      process.exit(1);
    }
  }

  const optionalMissing = OPTIONAL_ENV_VARS.filter((envVar) => !process.env[envVar]);
  if (optionalMissing.length > 0) {
    logger.warn('Optional environment variables not set', { optionalMissing });
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL && !process.env.ALLOWED_ORIGINS) {
    logger.warn('FRONTEND_URL or ALLOWED_ORIGINS not set — CORS will default to localhost only');
  }

  logger.info('Environment validation completed');
}

module.exports = { validateEnv };
