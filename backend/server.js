const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { connectDatabase } = require('./config/db');
const { initRedis } = require('./config/redisClient');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { getRouteRoomName } = require('./utils/socketRooms');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
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
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'UNI Transportation backend running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);

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
