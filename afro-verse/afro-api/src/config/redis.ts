import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Redis Configuration
 * 
 * Handles Redis client initialization for caching.
 */

let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
export async function initializeRedis(): Promise<Redis | null> {
  if (!env.REDIS_URL) {
    logger.warn('Redis not configured (REDIS_URL missing), using in-memory fallback');
    return null;
  }

  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    // Test connection
    await redisClient.ping();
    
    logger.info('Redis initialized successfully');
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', error);
    redisClient = null;
    isConnected = false;
    return null;
  }
}

/**
 * Get Redis client instance (null if not configured)
 */
export function getRedisClient(): Redis | null {
  return isConnected ? redisClient : null;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Cache service with fallback to in-memory storage
 */
class CacheService {
  private memoryCache = new Map<string, { value: string; expiry: number }>();

  async get(key: string): Promise<string | null> {
    const redis = getRedisClient();
    
    if (redis) {
      try {
        return await redis.get(key);
      } catch (error) {
        logger.error('Redis get error', error);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }
    
    if (cached) {
      this.memoryCache.delete(key);
    }
    
    return null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const redis = getRedisClient();
    
    if (redis) {
      try {
        await redis.setex(key, ttlSeconds, value);
        return;
      } catch (error) {
        logger.error('Redis set error', error);
      }
    }

    // Fallback to memory cache
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    
    if (redis) {
      try {
        await redis.del(key);
        return;
      } catch (error) {
        logger.error('Redis del error', error);
      }
    }

    // Fallback to memory cache
    this.memoryCache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const redis = getRedisClient();
    
    if (redis) {
      try {
        const result = await redis.exists(key);
        return result === 1;
      } catch (error) {
        logger.error('Redis exists error', error);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return true;
    }
    
    if (cached) {
      this.memoryCache.delete(key);
    }
    
    return false;
  }

  /**
   * Clean expired entries from memory cache
   */
  private cleanMemoryCache() {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now >= value.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Create singleton cache service
export const cacheService = new CacheService();

// Clean memory cache every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    (cacheService as any).cleanMemoryCache();
  }, 60 * 1000);
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && isConnected) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', error);
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
}

