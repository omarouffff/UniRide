const { logger } = require('../utils/logger');

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

const PRODUCTION_REQUIRED = ['QR_ENCRYPTION_SECRET', 'RESEND_API_KEY', 'EMAIL_FROM'];

const OPTIONAL_ENV_VARS = [
  'PAYMOB_API_KEY',
  'PAYMOB_HMAC_SECRET',
  'PAYMOB_INTEGRATION_ID',
  'PAYMOB_IFRAME_ID',
  'FAWRY_MERCHANT_CODE',
  'FAWRY_SECURITY_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const PLACEHOLDER_PATTERNS = ['replace-with', 'your-', 'changeme', 'password@cluster'];

function isPlaceholder(value) {
  if (!value || typeof value !== 'string') return true;
  const lower = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p)) || value.length < 32;
}

function validateEnv() {
  const missing = [];

  REQUIRED_ENV_VARS.forEach((envVar) => {
    if (!process.env[envVar] || isPlaceholder(process.env[envVar])) {
      missing.push(envVar);
    }
  });

  if (!process.env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  if (missing.length > 0) {
    logger.error('CRITICAL: Missing or weak environment variables', { missing });
    console.error(`\x1b[31mCRITICAL: Set strong values for:\n  ${missing.join(', ')}\nRun: node scripts/generateSecrets.js\x1b[0m\n`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const prodMissing = PRODUCTION_REQUIRED.filter(
      (key) => !process.env[key] || isPlaceholder(process.env[key])
    );
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
