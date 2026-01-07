// Load environment variables first
require('dotenv').config();

import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './config/db';
import { scheduleSecurityJobs } from './jobs/securityCleanup';

/**
 * Server Entry Point (Local Development)
 * 
 * Note: On Vercel, api/index.ts is used instead.
 */

async function startServer() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    try {
      await connectDatabase();
      logger.info('✅ MongoDB connected');
    } catch (error: any) {
      if (env.NODE_ENV === 'development') {
        logger.warn('⚠️  Continuing without MongoDB (development mode)');
      } else {
        throw error;
      }
    }

    // Create Express app
    const app = createApp();

    // Schedule security jobs (only in non-serverless environment)
    if (!process.env.VERCEL) {
      logger.info('Scheduling security jobs...');
      scheduleSecurityJobs();
      logger.info('✅ Security jobs scheduled');
    }

    // Start server
    const port = env.PORT || 3001;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`, {
        environment: env.NODE_ENV,
        port,
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      
      try {
        const { closeRedis } = await import('./middleware/rateLimiter.middleware');
        await closeRedis();
        logger.info('Redis connection closed');
      } catch (error) {
        // Redis might not be configured
      }
      
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      
      await mongoose.connection.close();
      
      try {
        const { closeRedis } = await import('./middleware/rateLimiter.middleware');
        await closeRedis();
      } catch (error) {
        // Ignore
      }
      
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Only start server if not on Vercel
if (!process.env.VERCEL) {
  startServer();
}
