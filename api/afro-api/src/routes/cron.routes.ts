import { Router } from 'express';
import { generationRetry } from '../controllers/cron.controller';

/**
 * Cron Routes (Vercel Cron)
 * 
 * Scheduled tasks for retry/recovery.
 */

const router = Router();

// Generation retry/recovery (run every minute)
router.get('/generation-retry', generationRetry);

export default router;







