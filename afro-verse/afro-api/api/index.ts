// api/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

require('dotenv').config();

let app: any = null;
let dbConnected = false;

async function getApp() {
  if (!app) {
    const { createApp } = await import('../src/app');
    app = createApp();
    
    try {
      const { connectDatabase } = await import('../src/config/db');
      await connectDatabase();
      dbConnected = true;
    } catch (e) {
      console.error('DB connection failed:', e);
    }
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle OPTIONS - headers already set by Vercel CDN
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const expressApp = await getApp();
  return expressApp(req, res);
}
