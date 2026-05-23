const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const xss = require('xss-clean');
const dotenv = require('dotenv');
const Sentry = require('@sentry/node');
const expressWinston = require('express-winston');
const { Server } = require('socket.io');
const { connectDatabase, prisma } = require('./prisma/client');
const { initRedis, getRedisClient } = require('./config/redisClient');
const cloudinary = require('./config/cloudinary');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { getRouteRoomName } = require('./utils/socketRooms');
const { logger } = require('./utils/logger');
const { resolveUserFromToken } = require('./middleware/authMiddleware');

dotenv.config();

const { validateEnv } = require('./config/env');
validateEnv();

const appVersion = process.env.DEPLOYMENT_VERSION || process.env.BUILD_ID || 'dev';

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

function buildAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set(fromEnv)];
}

const allowedOrigins = buildAllowedOrigins();

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  if (process.env.ALLOW_VERCEL_PREVIEWS !== 'false') {
    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith('.vercel.app')) return true;
    } catch {
      return false;
    }
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-client-version'],
};

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(Sentry.Handlers.requestHandler());
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(xss());

const createRateLimiter = (options) => {
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }
  let store;
  try {
    const redisClient = getRedisClient();
    if (redisClient) {
      store = new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) });
    }
  } catch (error) {
    logger.warn('Redis unavailable for rate limiting, using in-memory rate limiter fallback');
  }

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    windowMs: 15 * 60 * 1000,
    max: 300,
    store,
    ...options,
  });
};

app.use('/api/auth/login', createRateLimiter({ max: 10 }));
app.use('/api/auth', createRateLimiter({ max: 60 }));
app.use('/api/', createRateLimiter({ max: 300 }));

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader('x-app-version', appVersion);
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'geolocation=(), microphone=()');
  next();
});

app.use((req, res, next) => {
  if (
    req.path === '/api/payments/webhook' ||
    req.path === '/api/payments/fawry/webhook' ||
    process.env.NODE_ENV === 'test'
  ) {
    return next();
  }
  csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 2 * 60 * 60 * 1000,
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    value: (req) => req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf,
  })(req, res, next);
});

app.use((req, res, next) => {
  const clientVersion = req.headers['x-client-version'];
  if (clientVersion && clientVersion !== appVersion) {
    return res.status(409).json({
      message: 'Client version mismatch. Please refresh your application.',
      serverVersion: appVersion,
      clientVersion,
    });
  }
  next();
});

app.get('/api/health', async (req, res) => {
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (error) {
    logger.warn('Prisma health check failed', { error: error.message });
  }

  const cloudinaryConfig = cloudinary.config();
  const cloudinaryValues = [cloudinaryConfig.cloud_name, cloudinaryConfig.api_key, cloudinaryConfig.api_secret];
  const hasCloudinaryPlaceholder = cloudinaryValues.some((value) => typeof value === 'string' && value?.startsWith('your-'));

  res.status(200).json({
    success: true,
    status: 'running',
    version: appVersion,
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbConnected,
    },
    cloudinary: {
      configured: Boolean(cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret && !hasCloudinaryPlaceholder),
      cloudName: cloudinaryConfig.cloud_name || null,
    },
  });
});

app.get('/api/version', (req, res) => {
  res.json({ version: appVersion, buildId: appVersion });
});

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get('/api/keep-alive', (req, res) => {
  res.json({ status: 'ok', message: 'Keep-alive ping received' });
});

io.use(async (socket, next) => {
  const authToken = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  if (!authToken) {
    return next(new Error('Authentication required for socket connection'));
  }
  try {
    const user = await resolveUserFromToken(authToken);
    if (!user || !user.isActive) {
      return next(new Error('Unauthorized socket user'));
    }
    socket.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(new Error('Socket authentication failed'));
  }
});

const socketEventCounts = new Map();
io.on('connection', (socket) => {
  socket.on('subscribe', ({ userId }) => {
    if (socket.user?.id === userId) {
      socket.join(userId.toString());
    }
  });

  socket.on('subscribeRoute', ({ route, date }) => {
    const roomName = getRouteRoomName(route, date);
    if (roomName) {
      socket.join(roomName);
    }
  });

  socket.use((packet, next) => {
    const key = `${socket.id}:${packet[0]}`;
    const count = (socketEventCounts.get(key) || 0) + 1;
    socketEventCounts.set(key, count);
    setTimeout(() => socketEventCounts.set(key, Math.max((socketEventCounts.get(key) || 1) - 1, 0)), 10000);
    if (count > 50) {
      return next(new Error('Socket rate limit exceeded'));
    }
    next();
  });

  socket.on('disconnect', () => {
    socketEventCounts.forEach((value, key) => {
      if (key.startsWith(socket.id)) {
        socketEventCounts.delete(key);
      }
    });
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDatabase();
  await initRedis();

  if (process.env.ENABLE_NO_SHOW_CRON !== 'false') {
    const { processNoShows } = require('./jobs/noShowCron');
    const intervalMs = Number(process.env.NO_SHOW_CRON_INTERVAL_MS || 15 * 60 * 1000);
    setInterval(() => {
      processNoShows().catch((err) => logger.error('No-show cron failed', { error: err.message }));
    }, intervalMs);
    logger.info('No-show cron scheduled', { intervalMs });
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Backend server listening on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      allowedOrigins,
      healthCheck: `/api/health`,
    });
  });
}

if (require.main === module) {
  start().catch((error) => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  });
}

module.exports = { app, server };