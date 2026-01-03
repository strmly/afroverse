import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import {
  flagPostController,
  removePostController,
  banUserController,
  unbanUserController,
} from '../controllers/admin.controller';

/**
 * Admin Routes
 * 
 * Protected by:
 * - JWT auth (admin role required)
 * - IP allowlist (optional, configured in admin.middleware)
 */

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth);
router.use(requireAdmin);

// Post moderation
router.post('/posts/:id/flag', flagPostController);
router.post('/posts/:id/remove', removePostController);

// User moderation
router.post('/users/:id/ban', banUserController);
router.post('/users/:id/unban', unbanUserController);

export default router;

