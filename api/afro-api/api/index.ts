/**
 * Vercel Serverless Function Entry Point
 * 
 * This file wraps the Express app for Vercel's serverless environment.
 */

// Load environment variables
require('dotenv').config();

import { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/db';
import { logger } from '../src/utils/logger';

// Global app instance (cached across invocations)
let app: any = null;
let isDbConnected = false;

/**
 * Initialize the application
 */
async function initializeApp() {
  if (!app) {
    // Connect to database (only once)
    if (!isDbConnected) {
      try {
        await connectDatabase();
        isDbConnected = true;
        logger.info('✅ MongoDB connected (serverless)');
      } catch (error: any) {
        logger.error('❌ MongoDB connection failed:', error);
        // Continue without DB in development
        if (process.env.NODE_ENV !== 'development') {
          throw error;
        }
      }
    }
    
    // Create Express app
    app = createApp();
    logger.info('✅ Express app initialized (serverless)');
  }
  
  return app;
}

/**
 * Vercel Serverless Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await initializeApp();
    
    // Handle the request with Express
    return expressApp(req, res);
  } catch (error: any) {
    logger.error('Serverless handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}





