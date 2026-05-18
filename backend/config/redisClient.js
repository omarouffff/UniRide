const { createClient } = require('redis');

let redisClient;

async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('⚠️ REDIS_URL is not defined. Redis will be skipped.');
    return;
  }

  redisClient = createClient({ url });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  await redisClient.connect();
  console.log('✅ Redis connected');
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

module.exports = { initRedis, getRedisClient };
