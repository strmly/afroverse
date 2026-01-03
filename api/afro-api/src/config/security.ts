import { env } from './env';

/**
 * Security Configuration
 * 
 * Centralized security policies and limits.
 */

export const securityConfig = {
  // Rate Limits (per time window)
  rateLimits: {
    otp: {
      send: {
        perPhone: { limit: env.NODE_ENV === 'development' ? 999999 : 3, window: 600 }, // Unlimited in dev, 3 in prod per 10 minutes
        perIp: { limit: env.NODE_ENV === 'development' ? 999999 : 10, window: 600 }, // Unlimited in dev, 10 in prod
        perDevice: { limit: env.NODE_ENV === 'development' ? 999999 : 5, window: 600 }, // Unlimited in dev
      },
      verify: {
        perSession: { limit: env.NODE_ENV === 'development' ? 999999 : 5, window: 3600 }, // Unlimited in dev, 5 per session in prod
        perPhone: { limit: env.NODE_ENV === 'development' ? 999999 : 10, window: 3600 }, // Unlimited in dev
        perIp: { limit: env.NODE_ENV === 'development' ? 999999 : 30, window: 3600 }, // Unlimited in dev, 30 in prod
      },
    },
    generation: {
      create: {
        perUser: { limit: 20, window: 86400 }, // 20 per day
        perUserHourly: { limit: env.NODE_ENV === 'development' ? 1000 : 5, window: 3600 }, // 1000 in dev for testing, 5 per hour in prod
        perIp: { limit: env.NODE_ENV === 'development' ? 1000 : 20, window: 3600 }, // 1000 in dev, 20 in prod
      },
      refine: {
        perGeneration: { limit: 10, window: 86400 }, // 10 versions per day
      },
      concurrent: {
        maxQueued: 2,
        maxRunning: 1,
      },
    },
    feed: {
      perUser: { limit: 120, window: 60 }, // 2 per second
      perIp: { limit: 60, window: 60 },
    },
    respect: {
      perUser: { limit: 60, window: 60 }, // 60 per minute
      toggleDebounce: 2, // seconds
    },
    upload: {
      init: {
        perUser: { limit: 20, window: 3600 },
        perIp: { limit: 60, window: 3600 },
      },
    },
  },
  
  // JWT Configuration
  jwt: {
    accessToken: {
      expiresIn: '15m',
      algorithm: 'HS256' as const, // Use RS256 in production
    },
    refreshToken: {
      expiresIn: '30d',
      rotateOnRefresh: true,
    },
  },
  
  // Content Safety
  contentSafety: {
    // Keywords that trigger immediate block
    denylist: [
      // Add hateful/violent terms (redacted for display)
      'hate_term_1',
      'violence_term_1',
      // etc - populate from external list
    ],
    
    maxPromptLength: 500,
    maxRefineLength: 250,
    maxCaptionLength: 120,
  },
  
  // Upload Limits
  upload: {
    maxSelfies: 3,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    signedUrlTTL: {
      upload: 600, // 10 minutes
      download: 1800, // 30 minutes
    },
    orphanCleanupAfter: 3600, // 1 hour
  },
  
  // Generation Quotas
  quotas: {
    generation: {
      free: {
        daily: 10,
        concurrent: 2,
      },
      paid: {
        daily: 100,
        concurrent: 5,
      },
    },
  },
  
  // Admin Security
  admin: {
    allowedIPs: env.ADMIN_ALLOWED_IPS?.split(',') || [],
    requireRole: 'admin',
  },
  
  // Feature Flags
  features: {
    disableGeneration: env.DISABLE_GENERATION === 'true',
    disableOTP: env.DISABLE_OTP === 'true',
    enableDeviceBinding: env.ENABLE_DEVICE_BINDING === 'true',
  },
  
  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
};

export type RateLimitConfig = {
  limit: number;
  window: number; // seconds
};

export type RateLimitKey = {
  prefix: string;
  identifier: string;
};



