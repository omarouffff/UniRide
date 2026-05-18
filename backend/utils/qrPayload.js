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

module.exports = { encryptQrPayload };
