import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import {
  getTribes,
  getTribe,
  joinTribeController,
  getTribePosts,
  getTribeMembers,
  getTribePreview,
} from '../controllers/tribe.controller';

/**
 * Tribe Routes
 * 
 * GET /tribes - List all tribes
 * GET /tribes/:slug - Tribe header
 * POST /tribes/:slug/join - Join tribe
 * GET /tribes/:slug/posts - Tribe posts grid
 * GET /tribes/:slug/members - Tribe members
 * GET /tribes/:slug/preview - Tribe preview (optional auth)
 */

const router = Router();

// Tribe directory (optional auth)
router.get('/', optionalAuth, getTribes);

// Tribe header (optional auth)
router.get('/:slug', optionalAuth, getTribe);

// Tribe preview (optional auth)
router.get('/:slug/preview', optionalAuth, getTribePreview);

// Join tribe (auth required)
router.post('/:slug/join', requireAuth, joinTribeController);

// Tribe posts (auth required)
router.get('/:slug/posts', requireAuth, getTribePosts);

// Tribe members (auth required)
router.get('/:slug/members', requireAuth, getTribeMembers);

export default router;

