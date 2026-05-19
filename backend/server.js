const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { connectDatabase } = require('./config/db');
const cloudinary = require('./config/cloudinary');
const { initRedis } = require('./config/redisClient');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { getRouteRoomName } = require('./utils/socketRooms');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('subscribe', ({ userId }) => {
    if (userId) {
      socket.join(userId.toString());
    }
  });

  socket.on('subscribeRoute', ({ route, date }) => {
    const roomName = getRouteRoomName(route, date);
    if (roomName) {
      socket.join(roomName);
    }
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// API middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  const cloudinaryConfig = cloudinary.config();
  const cloudinaryValues = [cloudinaryConfig.cloud_name, cloudinaryConfig.api_key, cloudinaryConfig.api_secret];
  const hasCloudinaryPlaceholder = cloudinaryValues.some((value) => typeof value === 'string' && value.startsWith('your-'));
  res.status(200).json({
    status: 'ok',
    message: 'UniRide backend running',
    database: {
      state: mongoose.connection.readyState,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
    },
    cloudinary: {
      configured: Boolean(cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret && !hasCloudinaryPlaceholder),
      cloudName: cloudinaryConfig.cloud_name || null,
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/payments', paymentRoutes);

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDatabase();
  await initRedis();

  server.listen(PORT, () => {
    console.log(`🚀 Backend server listening on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
