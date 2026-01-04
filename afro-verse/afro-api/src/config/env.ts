// Environment variables are loaded in server.ts

/**
 * Environment Configuration
 * 
 * Centralized environment variable management with validation.
 */

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Database
  MONGODB_URI: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // WhatsApp OTP
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
  
  // Storage
  GCS_BUCKET_NAME: string;
  GCS_PROJECT_ID: string;
  GCS_KEY_FILE?: string;
  CDN_BASE_URL?: string;
  
  // AI Providers
  OPENAI_API_KEY?: string;
  REPLICATE_API_KEY?: string;
  FAL_API_KEY?: string;
  GEMINI_API_KEY?: string;
  
  // Worker
  WORKER_URL?: string;
  GCP_REGION?: string;
  
  // Redis
  REDIS_URL?: string;
  
  // Security
  ADMIN_ALLOWED_IPS?: string;
  DISABLE_GENERATION?: string;
  DISABLE_OTP?: string;
  ENABLE_DEVICE_BINDING?: string;
  
  // Async Jobs (Vercel)
  API_URL?: string;
  CRON_SECRET?: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

function validateEnv(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV as any) || 'development';
  
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GCS_BUCKET_NAME',
    'GCS_PROJECT_ID',
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate CRON_SECRET in production (optional - will use generated secret if not provided)
  if (nodeEnv === 'production' && !process.env.CRON_SECRET) {
    console.warn('CRON_SECRET not set - cron endpoints will use auto-generated secret');
  }
  
  return {
    NODE_ENV: nodeEnv,
    PORT: parseInt(process.env.PORT || '3001', 10),
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI!,
    
    // Authentication
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
    
    // WhatsApp OTP
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,
    
    // Storage
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME!,
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID!,
    GCS_KEY_FILE: process.env.GCS_KEY_FILE,
    CDN_BASE_URL: process.env.CDN_BASE_URL,
    
    // AI Providers
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    REPLICATE_API_KEY: process.env.REPLICATE_API_KEY,
    FAL_API_KEY: process.env.FAL_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    
    // Worker
    WORKER_URL: process.env.WORKER_URL,
    GCP_REGION: process.env.GCP_REGION || 'us-central1',
    
    // Redis
    REDIS_URL: process.env.REDIS_URL,
    
    // Security
    ADMIN_ALLOWED_IPS: process.env.ADMIN_ALLOWED_IPS,
    DISABLE_GENERATION: process.env.DISABLE_GENERATION,
    DISABLE_OTP: process.env.DISABLE_OTP,
    ENABLE_DEVICE_BINDING: process.env.ENABLE_DEVICE_BINDING,
    
    // Async Jobs (Vercel)
    API_URL: process.env.API_URL,
    CRON_SECRET: process.env.CRON_SECRET || `auto-${Date.now()}-${Math.random().toString(36)}`,
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  };
}

export const env = validateEnv();

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

