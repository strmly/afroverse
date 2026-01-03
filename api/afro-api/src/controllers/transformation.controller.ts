/**
 * Transformation Controller
 * 
 * HTTP handlers for transformation endpoints.
 * 
 * These are the ONLY ways the mobile app interacts with transformations.
 * The app NEVER talks to GCS directly.
 */

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import * as TransformationService from '../services/transformation.service';
import { logger } from '../utils/logger';

/**
 * POST /v1/transformations
 * 
 * Create a new transformation
 */
export async function handleCreateTransformation(req: Request, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { prompt, visibility } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Prompt is required',
      });
    }
    
    if (!visibility || !['public', 'private'].includes(visibility)) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Visibility must be "public" or "private"',
      });
    }
    
    // TODO: Load reference images from user's selfies
    // For now, we'll pass empty array
    const referenceImages: Buffer[] = [];
    
    const result = await TransformationService.createTransformation({
      userId: user._id,
      prompt,
      referenceImages,
      visibility,
      aspectRatio: req.body.aspectRatio,
      quality: req.body.quality,
    });
    
    if (!result.success) {
      const statusCode = result.errorCode === 'validation_failed' ? 400 : 500;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    return res.status(200).json({
      transformationId: result.transformationId,
      state: result.state,
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      placement: result.placement,
    });
  } catch (error) {
    logger.error('Error in handleCreateTransformation', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create transformation',
    });
  }
}

/**
 * GET /v1/transformations/:id/status
 * 
 * Get transformation status (for polling)
 */
export async function handleGetTransformationStatus(req: Request, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Invalid transformation ID',
      });
    }
    
    const status = await TransformationService.getTransformationStatus(
      user._id,
      id
    );
    
    return res.status(200).json(status);
  } catch (error) {
    logger.error('Error in handleGetTransformationStatus', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get transformation status',
    });
  }
}

/**
 * GET /v1/transformations/:id/urls
 * 
 * Get transformation URLs
 */
export async function handleGetTransformationUrls(req: Request, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Invalid transformation ID',
      });
    }
    
    const result = await TransformationService.getTransformationUrls(
      user._id,
      id
    );
    
    if (!result.success) {
      return res.status(404).json({
        error: 'not_found',
        message: result.error,
      });
    }
    
    return res.status(200).json({
      imageUrl: result.imageUrl,
      thumbnailUrl: result.thumbnailUrl,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    logger.error('Error in handleGetTransformationUrls', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get transformation URLs',
    });
  }
}

/**
 * DELETE /v1/transformations/:id
 * 
 * Delete transformation
 */
export async function handleDeleteTransformation(req: Request, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Invalid transformation ID',
      });
    }
    
    const archive = req.query.archive === 'true';
    const permanent = req.query.permanent === 'true';
    
    const result = await TransformationService.deleteTransformation(
      user._id,
      id,
      { archive, permanent }
    );
    
    if (!result.success) {
      const statusCode = result.error === 'Unauthorized' ? 403 : 404;
      
      return res.status(statusCode).json({
        error: 'delete_failed',
        message: result.error,
      });
    }
    
    return res.status(200).json({
      message: 'Transformation deleted successfully',
    });
  } catch (error) {
    logger.error('Error in handleDeleteTransformation', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete transformation',
    });
  }
}

/**
 * POST /v1/transformations/:id/publish
 * 
 * Publish private draft to public feed
 */
export async function handlePublishTransformation(req: Request, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Invalid transformation ID',
      });
    }
    
    const result = await TransformationService.publishTransformation(
      user._id,
      id
    );
    
    if (!result.success) {
      const statusCode = result.error === 'Unauthorized' ? 403 : 404;
      
      return res.status(statusCode).json({
        error: 'publish_failed',
        message: result.error,
      });
    }
    
    return res.status(200).json({
      imageUrl: result.imageUrl,
      message: 'Transformation published successfully',
    });
  } catch (error) {
    logger.error('Error in handlePublishTransformation', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to publish transformation',
    });
  }
}



