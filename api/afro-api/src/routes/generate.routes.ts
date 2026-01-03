import { Router } from 'express';
import {
  handleCreateGeneration,
  handleRefineGeneration,
  handleGetGeneration,
  handleGetUserGenerations,
} from '../controllers/generate.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { generationLimiter } from '../middleware/rateLimiter.middleware';

/**
 * Generate Routes
 * 
 * /generate/*
 */

const router = Router();

// All generation routes require authentication
router.use(requireAuth);

// Generation endpoints with rate limiting
router.post('/', generationLimiter.create, handleCreateGeneration);
router.post('/:id/refine', generationLimiter.create, handleRefineGeneration);
router.get('/:id', handleGetGeneration);
router.get('/', handleGetUserGenerations);

export default router;

