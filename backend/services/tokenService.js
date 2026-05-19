const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.includes('replace-with') || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a strong random string (32+ characters)');
  }
  return secret;
}

function getJwtRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret.includes('replace-with') || secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be set to a strong random string (32+ characters)');
  }
  return secret;
}

function generateAccessToken(userId, sessionId) {
  return jwt.sign({ id: userId, sid: sessionId, type: 'access' }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function generateRefreshToken(userId, sessionId) {
  return jwt.sign({ id: userId, sid: sessionId, type: 'refresh' }, getJwtRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, getJwtSecret());
  if (decoded.type && decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, getJwtRefreshSecret());
  if (decoded.type && decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

function createTokenId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createTokenId,
  hashToken,
};
