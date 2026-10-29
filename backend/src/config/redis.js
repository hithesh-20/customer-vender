const config = require('./config');
const logger = require('../utils/logger');

// Resilient cache layer: uses real Redis when REDIS_ENABLED=true,
// seamlessly falls back to in-memory TTL Map when Redis is disabled/unreachable.
const memoryStore = new Map();
let redisClient = null;
let redisReady = false;

async function initRedis() {
  if (!config.redis.enabled) {
    logger.info('ℹ️ Cache running in fast in-memory TTL mode (set REDIS_ENABLED=true for Redis)');
    return null;
  }
  try {
    const redis = require('redis');
    redisClient = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        connectTimeout: 3000,
      },
      password: config.redis.password || undefined,
    });
    redisClient.on('error', (err) => {
      redisReady = false;
      logger.warn(`⚠️ Redis client warning (using memory fallback): ${err.message}`);
    });
    await redisClient.connect();
    redisReady = true;
    logger.info('✅ Redis cache connected');
    return redisClient;
  } catch (err) {
    redisReady = false;
    logger.warn(`⚠️ Redis unavailable (${err.message}); falling back to in-memory cache`);
    return null;
  }
}

function prefixed(key) {
  return `${config.redis.prefix}${key}`;
}

async function set(key, value, ttlSeconds = config.redis.ttl) {
  const fullKey = prefixed(key);
  const serialized = JSON.stringify(value);
  if (redisReady && redisClient) {
    try {
      if (ttlSeconds) {
        await redisClient.set(fullKey, serialized, { EX: ttlSeconds });
      } else {
        await redisClient.set(fullKey, serialized);
      }
      return true;
    } catch (_) {
      // fall through
    }
  }
  memoryStore.set(fullKey, {
    value: serialized,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  return true;
}

async function get(key) {
  const fullKey = prefixed(key);
  if (redisReady && redisClient) {
    try {
      const val = await redisClient.get(fullKey);
      return val ? JSON.parse(val) : null;
    } catch (_) {
      // fall through
    }
  }
  const entry = memoryStore.get(fullKey);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(fullKey);
    return null;
  }
  return JSON.parse(entry.value);
}

async function del(key) {
  const fullKey = prefixed(key);
  if (redisReady && redisClient) {
    try {
      await redisClient.del(fullKey);
    } catch (_) {
      // ignore
    }
  }
  memoryStore.delete(fullKey);
  return true;
}

async function setEx(key, value, ttlSeconds) {
  return set(key, value, ttlSeconds);
}

module.exports = {
  initRedis,
  set,
  get,
  del,
  setEx,
};
