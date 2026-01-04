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
 * Check if origin is allowed for CORS
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // Allow requests with no origin
  
  const allowedOrigins = [
    'https://afroverse-rose.vercel.app',
    'https://afroverse-ceca.vercel.app',
  ];
  
  // Check against default origins
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check against Vercel pattern
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return true;
  }
  
  // Check against CORS_ORIGIN env var if set
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const allowedOrigins = corsOrigin.includes(',') 
      ? corsOrigin.split(',').map(o => o.trim())
      : [corsOrigin];
    
    if (allowedOrigins.includes(origin)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Set CORS headers
 */
function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin as string | undefined;
  
  if (isOriginAllowed(origin) && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Device-ID, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Vercel Serverless Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests directly
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    return res.status(204).end();
  }
  
  // Set CORS headers for all requests
  setCorsHeaders(req, res);
  
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





