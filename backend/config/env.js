const { logger } = require('../utils/logger');

/** Hard-fail if missing — server cannot run without these */
const REQUIRED_ENV_VARS = ['JWT_SECRET'];

/** Warn if missing — payments / QR features may be limited */
const OPTIONAL_ENV_VARS = [
  'QR_ENCRYPTION_SECRET',
  'PAYMOB_API_KEY',
  'PAYMOB_HMAC_SECRET',
  'PAYMOB_INTEGRATION_ID',
  'PAYMOB_IFRAME_ID',
];

function validateEnv() {
  const missing = [];

  REQUIRED_ENV_VARS.forEach((envVar) => {
    if (!process.env[envVar]) missing.push(envVar);
  });

  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    missing.push('MONGO_URI or MONGODB_URI');
  }

  const optionalMissing = OPTIONAL_ENV_VARS.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    logger.error('CRITICAL: Missing environment variables!', { missing });
    console.error(`\x1b[31mCRITICAL ERROR: Missing required environment variables:\n  ${missing.join(', ')}\nPlease check your .env file.\x1b[0m\n`);

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    logger.info('Required environment variables validation passed.');
  }

  if (optionalMissing.length > 0) {
    logger.warn('Optional environment variables not set (some features may be disabled)', {
      optionalMissing,
    });
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL && !process.env.ALLOWED_ORIGINS) {
    logger.warn('FRONTEND_URL or ALLOWED_ORIGINS not set — CORS will default to localhost only');
  }
}

module.exports = { validateEnv };
