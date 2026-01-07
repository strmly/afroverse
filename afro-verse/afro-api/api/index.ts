// api/index.ts - Vercel Serverless Entry Point
import { VercelRequest, VercelResponse } from '@vercel/node';

// Load environment variables
require('dotenv').config();
// Import after env is set
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/db';
import { logger } from '../src/utils/logger';

const app = createApp();
// Database connection promise (reused across invocations)
let dbPromise: Promise<void> | null = null;

const ensureDbConnection = async () => {
  if (!dbPromise) {
    dbPromise = connectDatabase().catch((err) => {
      logger.error('Database connection failed', err);
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
};

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://afroverse-rose.vercel.app',
  'https://afroverse-ceca.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRITICAL: Set CORS headers FIRST, before anything else
  const origin = req.headers.origin as string | undefined;
  const allowedOrigin = (origin && isOriginAllowed(origin)) 
    ? origin 
    : 'https://afroverse-rose.vercel.app';
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Device-ID, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS preflight immediately - don't connect to DB
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await ensureDbConnection();
  } catch (error) {
    logger.error('Failed to connect to database', error);
    // Continue anyway - some routes might not need DB
  }

  // Pass request to Express app
  return app(req, res);
}
