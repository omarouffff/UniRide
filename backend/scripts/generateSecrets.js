#!/usr/bin/env node
const crypto = require('crypto');

function generateSecret(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url');
}

console.log('# Add these to your backend .env (never commit real values to git)');
console.log(`JWT_SECRET=${generateSecret()}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret()}`);
console.log(`QR_ENCRYPTION_SECRET=${generateSecret()}`);
