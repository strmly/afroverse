import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  createGeneration,
  refineGeneration,
  getGeneration,
  getUserGenerations,
} from '../services/generation.service';
import { getBucket } from '../config/storage';
import { BUCKETS } from '../config/buckets';
import { logger } from '../utils/logger';
import { cacheService } from '../config/redis';

/**
 * Generate Controller
 * 
 * HTTP handlers for AI generation endpoints.
 */

/**
 * POST /generate
 * 
 * Create new generation
 */
export async function handleCreateGeneration(req: Request, res: Response) {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const {
      selfieIds,
      mode,
      seedPostId,
      presetId,
      prompt,
      negativePrompt,
      aspect,
      quality,
    } = req.body;
    
    // Debug logging
    logger.info('Create generation request', {
      userId: req.userId,
      selfieIds,
      mode,
      prompt,
      bodyKeys: Object.keys(req.body),
    });
    
    // Validate required fields
    if (!selfieIds || !Array.isArray(selfieIds) || selfieIds.length === 0) {
      logger.warn('Invalid selfieIds', {
        selfieIds,
        isArray: Array.isArray(selfieIds),
        body: req.body,
      });
      return res.status(400).json({
        error: 'invalid_request',
        message: 'selfieIds is required and must be a non-empty array',
      });
    }
    
    if (!mode || !['preset', 'prompt', 'try_style'].includes(mode)) {
      logger.warn('Invalid mode', { mode, body: req.body });
      return res.status(400).json({
        error: 'invalid_request',
        message: 'mode must be preset, prompt, or try_style',
      });
    }
    
    // Convert selfieIds to ObjectIds
    const selfieObjectIds = selfieIds.map((id: string) => new Types.ObjectId(id));
    
    const result = await createGeneration({
      userId,
      selfieIds: selfieObjectIds,
      mode,
      seedPostId: seedPostId ? new Types.ObjectId(seedPostId) : undefined,
      presetId,
      prompt,
      negativePrompt,
      aspect: aspect || '1:1',
      quality: quality || 'standard',
    });
    
    if (!result.success) {
      const statusCode = result.errorCode === 'concurrent_limit' ? 429 : 400;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    // Estimate generation time based on quality
    const estimatedTimeMs = quality === 'high' ? 60000 : 45000; // 60s for high, 45s for standard
    
    return res.status(202).json({
      generationId: result.generationId,
      status: 'queued',
      estimatedTimeMs,
      message: 'Generation started. Poll for status.',
    });
  } catch (error) {
    logger.error('Error in handleCreateGeneration', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create generation',
    });
  }
}

/**
 * POST /generate/:id/refine
 * 
 * Refine existing generation
 */
export async function handleRefineGeneration(req: Request, res: Response) {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { id } = req.params;
    const { instruction } = req.body;
    
    if (!instruction || typeof instruction !== 'string') {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'instruction is required',
      });
    }
    
    const result = await refineGeneration(userId, id, instruction);
    
    if (!result.success) {
      const statusCode = 
        result.errorCode === 'unauthorized' ? 403 :
        result.errorCode === 'not_found' ? 404 :
        result.errorCode === 'concurrent_limit' ? 429 : 400;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    return res.status(202).json({
      generationId: result.generationId,
      status: 'queued',
      message: 'Refinement started. Poll for status.',
    });
  } catch (error) {
    logger.error('Error in handleRefineGeneration', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to refine generation',
    });
  }
}

/**
 * GET /generate/:id
 * 
 * Get generation status and results
 */
export async function handleGetGeneration(req: Request, res: Response) {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { id } = req.params;
    
    const generation = await getGeneration(userId, id);
    
    if (!generation) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Generation not found',
      });
    }
    
    // Generate signed URLs for completed versions with caching
    // Use RAW_GENERATIONS bucket where the images are stored
    const bucket = getBucket(BUCKETS.RAW_GENERATIONS);
    logger.info('Generating signed URLs for versions', {
      generationId: id,
      versionCount: generation.versions.length,
      versions: generation.versions.map(v => ({ versionId: v.versionId, imagePath: v.imagePath })),
    });
    
    const versionsWithUrls = await Promise.all(
      generation.versions.map(async (version) => {
        // Try to get cached URLs (25 min cache, URLs valid for 30 min)
        const imageCacheKey = `signed_url:${version.imagePath}`;
        const thumbCacheKey = `signed_url:${version.thumbPath}`;
        
        let imageUrl = await cacheService.get(imageCacheKey);
        let thumbUrl = await cacheService.get(thumbCacheKey);
        
        // Generate new URLs if not cached
        if (!imageUrl) {
          logger.info('Generating signed URL for image', { imagePath: version.imagePath });
          const imageFile = bucket.file(version.imagePath);
          [imageUrl] = await imageFile.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 30 * 60 * 1000, // 30 minutes
          });
          // Cache for 25 minutes (less than URL expiry)
          await cacheService.set(imageCacheKey, imageUrl, 25 * 60);
          logger.info('Generated signed URL', { imageUrl: imageUrl.substring(0, 100) + '...' });
        }
        
        if (!thumbUrl) {
          const thumbFile = bucket.file(version.thumbPath);
          [thumbUrl] = await thumbFile.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 30 * 60 * 1000,
          });
          await cacheService.set(thumbCacheKey, thumbUrl, 25 * 60);
        }
        
        const versionWithUrl = {
          versionId: version.versionId,
          imageUrl,
          thumbUrl,
          createdAt: version.createdAt,
        };
        
        logger.info('Version with URL prepared', { versionId: version.versionId, hasImageUrl: !!imageUrl, hasThumbUrl: !!thumbUrl });
        
        return versionWithUrl;
      })
    );
    
    logger.info('All signed URLs generated', { versionCount: versionsWithUrls.length });
    
    // Calculate elapsed time
    const elapsedTimeMs = Date.now() - new Date(generation.createdAt).getTime();
    
    // Estimate remaining time based on status and quality
    let estimatedTimeMs = generation.style.parameters.quality === 'high' ? 60000 : 45000;
    let remainingTimeMs = 0;
    
    if (generation.status === 'queued') {
      remainingTimeMs = estimatedTimeMs;
    } else if (generation.status === 'running') {
      remainingTimeMs = Math.max(0, estimatedTimeMs - elapsedTimeMs);
    }
    
    return res.status(200).json({
      id: generation._id,
      status: generation.status,
      mode: generation.source.mode,
      versions: versionsWithUrls,
      error: generation.error,
      timing: {
        estimatedTotalMs: estimatedTimeMs,
        elapsedMs: elapsedTimeMs,
        remainingMs: remainingTimeMs,
      },
      createdAt: generation.createdAt,
      updatedAt: generation.updatedAt,
    });
  } catch (error) {
    logger.error('Error in handleGetGeneration', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get generation',
    });
  }
}

/**
 * GET /generate
 * 
 * Get user's generations
 */
export async function handleGetUserGenerations(req: Request, res: Response) {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { limit, before } = req.query;
    
    const generations = await getUserGenerations(
      userId,
      limit ? parseInt(limit as string) : 20,
      before ? new Date(before as string) : undefined
    );
    
    return res.status(200).json({
      generations: generations.map(g => ({
        id: g._id,
        status: g.status,
        mode: g.source.mode,
        versionsCount: g.versions.length,
        hasError: !!g.error,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
    });
  } catch (error) {
    logger.error('Error in handleGetUserGenerations', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get generations',
    });
  }
}



