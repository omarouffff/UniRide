const Sentry = require('@sentry/node');

function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorHandler(err, req, res, next) {
  Sentry.captureException(err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  // 1. Mongoose Bad ObjectId Cast Error
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `Invalid resource ID format: ${err.value}`;
  }

  // 2. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((el) => el.message);
  }

  // 3. Mongoose Duplicate Field Key Error (Mongo 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }

  // 4. JWT WebToken errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication token is invalid. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please refresh your session.';
  }

  // 5. CSRF Token Bad Errors
  if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Form security verification expired or invalid CSRF token.';
  }

  // Log error in non-production for visibility
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.error(`\x1b[31m[Error Handler] ${req.method} ${req.originalUrl} - ${statusCode}\x1b[0m`);
    console.error(err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
