const { createClient } = require("redis");
const logger = require("../utils/logger");
const env = require("./env");

// Singleton client to prevent multiple connections in dev mode
const globalForRedis = globalThis;

let redisClient = globalForRedis.redisClient;

if (!redisClient) {
  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries, cause) => {
        // If it's a refused connection, fail immediately so we don't spam the user's terminal
        if (cause && cause.code === "ECONNREFUSED") {
           return new Error("Connection refused. Disabling Redis.");
        }
        
        // Try up to 3 reconnect attempts for other random drops
        if (retries > 3) {
          return new Error("Max retries exhausted");
        }
        return Math.min(retries * 50, 500);
      },
    },
  });

  redisClient.on("error", (err) => {
    // Silence the annoying ECONNREFUSED spam if the server is starting without Redis
    if (err.code !== "ECONNREFUSED") {
      logger.error("Redis Client Error:", err);
    }
  });
  redisClient.on("connect", () => logger.info("✅ Redis connected successfully"));
  redisClient.on("reconnecting", () => logger.warn("⚠️ Redis reconnecting..."));

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redisClient = redisClient;
  }
}

/**
 * Cache helper functions
 */
const cache = {
  /**
   * Get parsed JSON data from cache
   */
  async get(key) {
    if (!redisClient.isOpen) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis Get Error (Key: ${key}):`, error);
      return null;
    }
  },

  /**
   * Set JSON data to cache with optional TTL
   * Default TTL is 1 hour (3600 seconds)
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch (error) {
      logger.error(`Redis Set Error (Key: ${key}):`, error);
    }
  },

  /**
   * Invalidate/delete a specific cache key
   */
  async invalidate(key) {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Redis Invalidate Error (Key: ${key}):`, error);
    }
  },

  /**
   * Get parsed JSON data from a hash field
   */
  async hGet(hashKey, field) {
    if (!redisClient.isOpen) return null;
    try {
      const data = await redisClient.hGet(hashKey, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis HGet Error (Hash: ${hashKey}, Field: ${field}):`, error);
      return null;
    }
  },

  /**
   * Set JSON data to a hash field with optional TTL on the hashKey
   */
  async hSet(hashKey, field, value, ttlSeconds = 3600) {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.hSet(hashKey, field, JSON.stringify(value));
      await redisClient.expire(hashKey, ttlSeconds);
    } catch (error) {
      logger.error(`Redis HSet Error (Hash: ${hashKey}):`, error);
    }
  },
  
  /**
   * Connect explicitly
   */
  async connect() {
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (error) {
        logger.warn("⚠️ Redis cache disabled: Connection failed. Server will continue without caching.");
        // The client emits 'error' events, which our listener at the top handles.
        // We catch here so the server startup doesn't crash.
      }
    }
  },
  
  /**
   * Disconnect gracefully
   */
  async disconnect() {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  }
};

module.exports = { redisClient, cache };
