import { Router } from 'express';
import { handleProcessGeneration } from '../controllers/worker.controller';

/**
 * Worker Routes
 * 
 * /worker/*
 * 
 * These endpoints are called by Cloud Tasks or internally.
 * In production, should be protected by Cloud Tasks authentication.
 */

const router = Router();

// Process generation task
router.post('/process-generation', handleProcessGeneration);

export default router;







