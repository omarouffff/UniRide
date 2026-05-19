const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return secret;
}

function generateAccessToken(userId, sessionId) {
  return jwt.sign({ id: userId, sid: sessionId }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function generateRefreshToken(userId, sessionId) {
  return jwt.sign({ id: userId, sid: sessionId }, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getJwtSecret());
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