import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { getUserPosts } from '../controllers/post.controller';
import {
  getMe,
  updateMe,
  setMyAvatar,
  checkUsername,
  getUserProfileController,
  getUserAvatarController,
} from '../controllers/profile.controller';

/**
 * User Routes
 * 
 * Profile:
 * GET /me - Self profile
 * PATCH /me - Update profile
 * POST /me/avatar - Set avatar
 * 
 * Public:
 * GET /users/:username - Public profile
 * GET /users/:username/posts - Profile grid
 * GET /users/:username/avatar - Avatar only
 */

const router = Router();

// Self profile (auth required)
router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);
router.post('/me/avatar', requireAuth, setMyAvatar);
router.get('/check-username', requireAuth, checkUsername);

// Public profile (optional auth)
router.get('/:username', optionalAuth, getUserProfileController);
router.get('/:username/avatar', optionalAuth, getUserAvatarController);

// User posts (optional auth)
router.get('/:username/posts', optionalAuth, getUserPosts);

// Social endpoints (from follow routes, mounted here for REST consistency)
const { handleGetRelationship, handleGetFollowing, handleGetFollowers } = require('../controllers/follow.controller');
router.get('/:userId/relationship', optionalAuth, handleGetRelationship);
router.get('/:userId/following', optionalAuth, handleGetFollowing);
router.get('/:userId/followers', optionalAuth, handleGetFollowers);

export default router;

