const crypto = require('crypto');

function getQrSecret() {
  const secret = process.env.QR_ENCRYPTION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('QR_ENCRYPTION_SECRET is required in production');
    }
    throw new Error('QR_ENCRYPTION_SECRET is not configured');
  }
  if (secret.includes('replace-with') || secret.length < 32) {
    throw new Error('QR_ENCRYPTION_SECRET must be a strong random string (32+ characters)');
  }
  return secret;
}

function encryptQrPayload(payload) {
  const key = crypto.createHash('sha256').update(getQrSecret()).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decryptQrPayload(token) {
  const key = crypto.createHash('sha256').update(getQrSecret()).digest();
  const raw = Buffer.from(token, 'base64url');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

module.exports = { encryptQrPayload, decryptQrPayload };
