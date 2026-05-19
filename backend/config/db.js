const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGO_URI or MONGODB_URI is not defined in environment variables');
  }

  mongoose.set('strictQuery', true);
  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.info('MongoDB reconnected successfully');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),
    retryWrites: true,
    autoIndex: false,
    appName: process.env.APP_NAME || 'UniRideBackend',
    w: 'majority',
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = { connectDatabase };
