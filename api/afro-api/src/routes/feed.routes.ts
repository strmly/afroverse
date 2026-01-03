import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getFeedController,
  getHotFeedController,
} from '../controllers/feed.controller';

/**
 * Feed Routes
 * 
 * GET /feed - Personalized tribe-first feed
 * GET /feed/hot - Trending/hot feed
 */

const router = Router();

// All feed routes require authentication
router.use(requireAuth);

// Get personalized feed
router.get('/', getFeedController);

// Get hot feed
router.get('/hot', getHotFeedController);

export default router;

