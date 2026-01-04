import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuid } from 'uuid';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { createRateLimiter } from './middleware/rateLimiter.middleware';
import { securityConfig } from './config/security';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import tribeRoutes from './routes/tribe.routes';
import generateRoutes from './routes/generate.routes';
import postRoutes from './routes/post.routes';
import feedRoutes from './routes/feed.routes';
import mediaRoutes from './routes/media.routes';
import transformationRoutes from './routes/transformation.routes';
import workerRoutes from './routes/worker.routes';
import adminRoutes from './routes/admin.routes';
import jobsRoutes from './routes/jobs.routes';
import cronRoutes from './routes/cron.routes';
import followRoutes from './routes/follow.routes';

// Import security middleware
import { sanitizeInput } from './middleware/validation.middleware';

/**
 * Express Application Setup
 */

export function createApp(): Express {
  const app = express();
  
  // CORS - MUST be first to handle preflight OPTIONS requests
  // Support multiple origins (comma-separated) or single origin
  const getCorsOrigin = (): string | string[] | boolean | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) => {
    if (env.NODE_ENV === 'development') {
      return '*'; // Allow all in development
    }
    
    const corsOrigin = process.env.CORS_ORIGIN;
    
    // Default allowed origins (Vercel patterns)
    const defaultOrigins = [
      'https://afroverse-rose.vercel.app',
      'https://afroverse-ceca.vercel.app',
    ];
    
    // Function to check if origin is allowed
    const originChecker = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check against default origins
      if (defaultOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Check against Vercel pattern
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      
      // Check against CORS_ORIGIN env var if set
      if (corsOrigin) {
        const allowedOrigins = corsOrigin.includes(',') 
          ? corsOrigin.split(',').map(o => o.trim())
          : [corsOrigin];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      
      // Deny by default
      callback(null, false);
    };
    
    return originChecker;
  };
  
  app.use(cors({
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Device-ID', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));
  
  // Explicit OPTIONS handler as fallback (in case CORS middleware doesn't catch it)
  app.options('*', (req: Request, res: Response) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://afroverse-rose.vercel.app',
      'https://afroverse-ceca.vercel.app',
    ];
    
    // Check if origin is allowed
    const isAllowed = !origin || 
      allowedOrigins.includes(origin) || 
      /^https:\/\/.*\.vercel\.app$/.test(origin) ||
      (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.split(',').map(o => o.trim()).includes(origin));
    
    if (isAllowed && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Device-ID, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(204).end();
  });
  
  // Security middleware (configured to not interfere with CORS)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable CSP to avoid conflicts
  }));
  
  // Security headers
  app.use((_req, res, next) => {
    Object.entries(securityConfig.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  });
  
  // Request ID for tracing
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.id = (req.headers['x-request-id'] as string) || uuid();
    res.setHeader('x-request-id', req.id);
    next();
  });
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Input sanitization
  app.use(sanitizeInput);
  
  // Global rate limiting (basic IP-based)
  // In development, use a much higher limit for testing
  const rateLimit = env.NODE_ENV === 'development' ? 1000 : 100;
  const globalRateLimiter = createRateLimiter(
    { limit: rateLimit, window: 900 }, // 1000 requests per 15 minutes in dev, 100 in prod
    (req) => `rl:global:ip:${req.ip || 'unknown'}`
  );
  app.use(globalRateLimiter);
  
  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next();
  });
  
  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'AfroMoji API',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        users: '/api/users',
        tribes: '/api/tribes',
        posts: '/api/posts',
        feed: '/api/feed',
        generate: '/api/generate',
        media: '/api/media',
      },
    });
  });
  
  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tribes', tribeRoutes);
  app.use('/api/generate', generateRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/follow', followRoutes);
  app.use('/v1/transformations', transformationRoutes);
  
  // Worker routes (for Cloud Tasks)
  app.use('/worker', workerRoutes);
  
  // Admin routes (protected)
  app.use('/admin', adminRoutes);
  
  // Job routes (Vercel background functions)
  app.use('/api/jobs', jobsRoutes);
  
  // Cron routes (Vercel cron)
  app.use('/api/cron', cronRoutes);
  
  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'not_found',
      message: 'Endpoint not found',
    });
  });
  
  // Error handling middleware (must be last)
  app.use(errorHandler);
  
  return app;
}

export default createApp();

