import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { env } from '../config/env';
import { securityConfig, RateLimitConfig } from '../config/security';
import { logger } from '../utils/logger';

/**
 * Rate Limiter Middleware
 * 
 * Redis-based sliding window rate limiting.
 * Protects against abuse and ensures fair usage.
 */

// Redis client (singleton)
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    logger.warn('Redis not configured - rate limiting disabled');
    return null;
  }
  
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });
    
    redisClient.on('error', (error) => {
      logger.error('Redis error', error);
    });
  }
  
  return redisClient;
}

/**
 * Check rate limit using sliding window algorithm
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const redis = getRedisClient();
  
  // If Redis not available, allow (fail open)
  if (!redis) {
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: Date.now() + config.window * 1000,
    };
  }
  
  const now = Date.now();
  const windowStart = now - config.window * 1000;
  
  try {
    // Use sorted set for sliding window
    const pipeline = redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry
    pipeline.expire(key, config.window);
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Pipeline execution failed');
    }
    
    // Get count (after removing old entries, before adding new one)
    const count = results[1][1] as number;
    
    const allowed = count < config.limit;
    const remaining = Math.max(0, config.limit - count - 1);
    const resetAt = now + config.window * 1000;
    
    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error: any) {
    logger.error('Rate limit check error', error);
    // Fail open
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: now + config.window * 1000,
    };
  }
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig, keyFn: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyFn(req);
      const result = await checkRateLimit(key, config);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetAt);
      
      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          key,
          ip: req.ip,
          userId: req.user?.id,
        });
        
        return res.status(429).json({
          error: 'rate_limited',
          message: 'Too many requests. Try again later.',
        });
      }
      
      return next();
    } catch (error: any) {
      logger.error('Rate limiter error', error);
      // Fail open
      return next();
    }
  };
}

/**
 * OTP send rate limiter
 */
export const otpSendLimiter = {
  phone: (phoneE164: string) =>
    createRateLimiter(
      securityConfig.rateLimits.otp.send.perPhone,
      () => `rl:otp_send:phone:${phoneE164}`
    ),
  
  ip: createRateLimiter(
    securityConfig.rateLimits.otp.send.perIp,
    (req) => `rl:otp_send:ip:${hashIP(req.ip || '')}`
  ),
  
  device: createRateLimiter(
    securityConfig.rateLimits.otp.send.perDevice,
    (req) => `rl:otp_send:device:${req.headers['x-device-id'] || 'unknown'}`
  ),
};

/**
 * OTP verify rate limiter
 */
export const otpVerifyLimiter = {
  session: (sessionId: string) =>
    createRateLimiter(
      securityConfig.rateLimits.otp.verify.perSession,
      () => `rl:otp_verify:session:${sessionId}`
    ),
  
  phone: (phoneE164: string) =>
    createRateLimiter(
      securityConfig.rateLimits.otp.verify.perPhone,
      () => `rl:otp_verify:phone:${phoneE164}`
    ),
  
  ip: createRateLimiter(
    securityConfig.rateLimits.otp.verify.perIp,
    (req) => `rl:otp_verify:ip:${hashIP(req.ip || '')}`
  ),
};

/**
 * Generation rate limiters
 */
export const generationLimiter = {
  create: createRateLimiter(
    securityConfig.rateLimits.generation.create.perUserHourly,
    (req) => `rl:gen:user:${req.user?.id}`
  ),
  
  daily: async (userId: string): Promise<boolean> => {
    const redis = getRedisClient();
    if (!redis) return true; // Fail open
    
    const key = `rl:gen:daily:${userId}:${getDateKey()}`;
    const config = securityConfig.rateLimits.generation.create.perUser;
    
    try {
      const count = await redis.incr(key);
      await redis.expire(key, config.window);
      
      return count <= config.limit;
    } catch (error) {
      logger.error('Daily generation limit check error', error);
      return true; // Fail open
    }
  },
};

/**
 * Feed rate limiter
 */
export const feedLimiter = createRateLimiter(
  securityConfig.rateLimits.feed.perUser,
  (req) => `rl:feed:user:${req.user?.id || req.ip}`
);

/**
 * Respect rate limiter
 */
export const respectLimiter = createRateLimiter(
  securityConfig.rateLimits.respect.perUser,
  (req) => `rl:respect:user:${req.user?.id}`
);

/**
 * Upload rate limiter
 */
export const uploadLimiter = {
  user: createRateLimiter(
    securityConfig.rateLimits.upload.init.perUser,
    (req) => `rl:upload:user:${req.user?.id}`
  ),
  
  ip: createRateLimiter(
    securityConfig.rateLimits.upload.init.perIp,
    (req) => `rl:upload:ip:${hashIP(req.ip || '')}`
  ),
};

/**
 * Check respect toggle spam
 */
export async function checkRespectToggle(
  postId: string,
  userId: string
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return true; // Fail open
  
  const key = `rl:respect_toggle:${postId}:${userId}`;
  const debounce = securityConfig.rateLimits.respect.toggleDebounce;
  
  try {
    // Check if exists (within debounce period)
    const exists = await redis.exists(key);
    
    if (exists) {
      logger.warn('Respect toggle spam detected', { postId, userId });
      return false; // Too fast
    }
    
    // Set with expiry
    await redis.setex(key, debounce, '1');
    
    return true;
  } catch (error) {
    logger.error('Respect toggle check error', error);
    return true; // Fail open
  }
}

/**
 * Hash IP for privacy
 */
function hashIP(ip: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

/**
 * Get date key for daily limits
 */
function getDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

