/**
 * Transformation Routes
 * 
 * API endpoints for transformation management.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as TransformationController from '../controllers/transformation.controller';

const router = Router();

/**
 * All routes require authentication
 */
router.use(requireAuth);

/**
 * POST /v1/transformations
 * Create new transformation
 */
router.post(
  '/',
  TransformationController.handleCreateTransformation
);

/**
 * GET /v1/transformations/:id/status
 * Get transformation status
 */
router.get(
  '/:id/status',
  TransformationController.handleGetTransformationStatus
);

/**
 * GET /v1/transformations/:id/urls
 * Get transformation URLs
 */
router.get(
  '/:id/urls',
  TransformationController.handleGetTransformationUrls
);

/**
 * DELETE /v1/transformations/:id
 * Delete transformation
 */
router.delete(
  '/:id',
  TransformationController.handleDeleteTransformation
);

/**
 * POST /v1/transformations/:id/publish
 * Publish private draft
 */
router.post(
  '/:id/publish',
  TransformationController.handlePublishTransformation
);

export default router;

