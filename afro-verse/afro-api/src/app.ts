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
  
  // Security middleware
  app.use(helmet());
  
  // Security headers
  app.use((_req, res, next) => {
    Object.entries(securityConfig.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  });
  
  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || (env.NODE_ENV === 'development' ? '*' : false),
    credentials: true,
  }));
  
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

