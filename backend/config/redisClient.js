const { createClient } = require('redis');

let redisClient;

async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('⚠️ REDIS_URL is not defined. Redis will be skipped.');
    return;
  }

  redisClient = createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries >= Number(process.env.REDIS_RECONNECT_MAX || 5)) {
          return new Error('Redis reconnect limit reached');
        }
        return 1000;
      },
    },
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('ℹ️ Redis client connected'));
  redisClient.on('ready', () => console.log('✅ Redis ready'));
  redisClient.on('reconnecting', () => console.warn('Redis reconnecting...'));

  try {
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️ Redis connection failed. Starting backend without Redis.', error.message);
    redisClient = null;
  }
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

module.exports = { initRedis, getRedisClient };
