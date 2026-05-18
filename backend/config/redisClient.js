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
        if (retries >= 5) {
          return new Error('Redis reconnect limit reached');
        }
        return 1000;
      },
    },
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('ℹ️ Redis client connected'));

  try {
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.warn('⚠️ Redis connection failed. Starting backend without Redis.');
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
