/**
 * Vercel Serverless Function Entry Point
 * 
 * This file wraps the Express app for Vercel's serverless environment.
 */

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
 * Get allowed origin for CORS
 * Returns the origin if allowed, or null if not allowed
 */
function getAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null; // No origin header means same-origin or non-browser request
  
  const allowedOrigins = [
    'https://afroverse-rose.vercel.app',
    'https://afroverse-ceca.vercel.app',
  ];
  
  // Check against default origins
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  // Check against Vercel pattern (allow all *.vercel.app domains)
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return origin;
  }
  
  // Check against CORS_ORIGIN env var if set
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const envOrigins = corsOrigin.includes(',') 
      ? corsOrigin.split(',').map(o => o.trim())
      : [corsOrigin];
    
    if (envOrigins.includes(origin)) {
      return origin;
    }
  }
  
  // For production, be permissive and allow the origin (can restrict later)
  // This ensures CORS works while we debug
  logger.warn('CORS: Allowing origin (permissive mode)', { origin });
  return origin;
}

/**
 * Set CORS headers - ALWAYS sets headers to ensure CORS works
 */
function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin as string | undefined;
  const allowedOrigin = getAllowedOrigin(origin);
  
  // Always set Access-Control-Allow-Origin if we have an origin
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  } else if (origin) {
    // Even if not explicitly allowed, set it (permissive mode)
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Always set these headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Device-ID, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

/**
 * Vercel Serverless Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  
  // Log CORS requests for debugging
  if (origin) {
    logger.info('CORS request', { 
      method: req.method, 
      path: req.url, 
      origin 
    });
  }
  
  // Handle CORS preflight requests directly
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    logger.info('CORS preflight handled', { origin });
    return res.status(204).end();
  }
  
  // Set CORS headers for all requests (MUST be before Express handles it)
  setCorsHeaders(req, res);
  
  try {
    const expressApp = await initializeApp();
    
    // Handle the request with Express
    return expressApp(req, res);
  } catch (error: any) {
    logger.error('Serverless handler error:', error);
    
    // Ensure CORS headers are set even on errors
    setCorsHeaders(req, res);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}





