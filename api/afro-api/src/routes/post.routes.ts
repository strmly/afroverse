import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  createPost,
  getPost,
  deletePost,
  respectPost,
  unrespectPost,
  sharePost,
} from '../controllers/post.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Post operations
router.post('/', createPost);
router.get('/:id', getPost);
router.delete('/:id', deletePost);

// Respect operations
router.post('/:id/respect', respectPost);
router.delete('/:id/respect', unrespectPost);

// Share tracking
router.post('/:id/share', sharePost);

export default router;

