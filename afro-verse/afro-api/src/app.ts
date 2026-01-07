import express, { Express, Request, Response, NextFunction } from 'express';
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

// Allowed origins list
const ALLOWED_ORIGINS = [
  'https://afroverse-rose.vercel.app',
  'https://afroverse-ceca.vercel.app',
  
];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  if (env.NODE_ENV === 'development') return true;
  
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
    if (allowedOrigins.includes(origin)) return true;
  }
  
  return false;
}

export function createApp(): Express {
  const app = express();
  
  // Trust proxy (important for Vercel)
  app.set('trust proxy', 1);
  
  // CORS middleware - MUST be first
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string | undefined;
    
    // Determine allowed origin
    const allowedOrigin = (origin && isOriginAllowed(origin))
      ? origin
      : 'https://afroverse-rose.vercel.app';
    
    // Set CORS headers for ALL requests
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Device-ID, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight OPTIONS request immediately
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });
  
  // Body parsing - must be before routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Security middleware (configured to not interfere with CORS)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));
  
  // Security headers (skip CORS-related ones as we handle them above)
  app.use((_req, res, next) => {
    const headers: Record<string, string> = { ...securityConfig.headers };
    // Remove any CORS headers from securityConfig to avoid conflicts
    delete headers['Access-Control-Allow-Origin'];
    delete headers['Access-Control-Allow-Methods'];
    delete headers['Access-Control-Allow-Headers'];
    delete headers['Access-Control-Allow-Credentials'];
    
    Object.entries(headers).forEach(([key, value]) => {
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
  
  // Input sanitization
  app.use(sanitizeInput);
  
  // Global rate limiting
  const rateLimit = env.NODE_ENV === 'development' ? 1000 : 100;
  const globalRateLimiter = createRateLimiter(
    { limit: rateLimit, window: 900 },
    (req) => `rl:global:ip:${req.ip || 'unknown'}`
  );
  app.use(globalRateLimiter);
  
  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
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
      cors: 'enabled',
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
      cors: 'enabled',
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
