const { logger } = require('../utils/logger');

const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'QR_ENCRYPTION_SECRET',
  'PAYMOB_API_KEY',
  'PAYMOB_HMAC_SECRET',
  'PAYMOB_INTEGRATION_ID',
  'PAYMOB_IFRAME_ID',
];

function validateEnv() {
  const missing = [];

  REQUIRED_ENV_VARS.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  // Provide fallback check for alternative mongo URI if MONGO_URI is missing
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    if (!missing.includes('MONGO_URI')) missing.push('MONGO_URI');
  } else {
    // Remove if one of them is present
    const index = missing.indexOf('MONGO_URI');
    if (index > -1) {
      missing.splice(index, 1);
    }
  }

  if (missing.length > 0) {
    logger.error('CRITICAL: Missing environment variables!', { missing });
    console.error(`\x1b[31mCRITICAL ERROR: Missing required environment variables:\n  ${missing.join(', ')}\nPlease check your .env file.\x1b[0m\n`);
    
    // In production or testing pipelines, we fail hard. In local development, we warn but allow boot with caution.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    logger.info('Environment variables validation check passed.');
  }
}

module.exports = { validateEnv };
