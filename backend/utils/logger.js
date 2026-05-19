const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const details = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}] ${message} ${details}`.trim();
    })
  ),
  transports: [new winston.transports.Console()],
});

function auditEvent(eventName, userId, metadata = {}) {
  logger.warn('Audit event', { eventName, userId, metadata });
}

module.exports = { logger, auditEvent };