const crypto = require('crypto');

function encryptQrPayload(payload) {
  const secret = process.env.QR_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'uniride-development-secret';
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decryptQrPayload(token) {
  const secret = process.env.QR_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'uniride-development-secret';
  const key = crypto.createHash('sha256').update(secret).digest();
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
