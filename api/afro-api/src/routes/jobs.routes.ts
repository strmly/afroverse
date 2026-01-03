import { Router } from 'express';
import { executeGenerationJob } from '../controllers/jobs.controller';

/**
 * Jobs Routes (Vercel Background Functions)
 * 
 * These are "workers" invoked via HTTP.
 */

const router = Router();

// Generation job execution
router.post('/generation', executeGenerationJob);

export default router;







