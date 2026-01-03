import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import {
  handleFollow,
  handleUnfollow,
  handleGetRelationship,
  handleGetFollowing,
  handleGetFollowers,
} from '../controllers/follow.controller';

/**
 * Follow Routes
 * 
 * POST /follow - Follow a user
 * DELETE /follow/:targetUserId - Unfollow a user
 * GET /users/:userId/relationship - Get relationship status
 * GET /users/:userId/following - Get users someone is following
 * GET /users/:userId/followers - Get user's followers
 */

const router = Router();

// Follow actions (auth required)
router.post('/', requireAuth, handleFollow);
router.delete('/:targetUserId', requireAuth, handleUnfollow);

// Relationship queries (optional auth)
router.get('/users/:userId/relationship', optionalAuth, handleGetRelationship);
router.get('/users/:userId/following', optionalAuth, handleGetFollowing);
router.get('/users/:userId/followers', optionalAuth, handleGetFollowers);

export default router;



