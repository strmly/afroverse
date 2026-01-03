import { Request, Response } from 'express';
import {
  executeGeneration,
  ExecuteGenerationParams,
} from '../services/generationJob.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Jobs Controller (Vercel Background Functions)
 * 
 * Handles async job execution.
 */

/**
 * POST /jobs/generation
 * 
 * Execute generation job (idempotent)
 * 
 * This is the "worker" - invoked via HTTP, designed to be called multiple times safely.
 */
export async function executeGenerationJob(req: Request, res: Response) {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  try {
    const { generationId, requestedVersionId, type } = req.body;
    
    // Validate input
    if (!generationId || !requestedVersionId || !type) {
      logger.warn('Invalid job request', { body: req.body });
      return res.status(400).json({
        error: 'invalid_request',
        message: 'generationId, requestedVersionId, and type are required',
      });
    }
    
    logger.info('Generation job started', {
      generationId,
      requestedVersionId,
      type,
      requestId,
    });
    
    // Execute job (idempotent)
    const params: ExecuteGenerationParams = {
      generationId,
      requestedVersionId,
      type,
      requestId,
    };
    
    const result = await executeGeneration(params);
    
    const duration = Date.now() - startTime;
    
    if (result.skipped) {
      logger.info('Generation job skipped', {
        generationId,
        requestedVersionId,
        reason: result.reason,
        duration,
      });
    } else if (result.success) {
      logger.info('Generation job succeeded', {
        generationId,
        requestedVersionId,
        duration,
      });
    } else {
      logger.warn('Generation job failed', {
        generationId,
        requestedVersionId,
        error: result.error,
        duration,
      });
    }
    
    // Always return 200 (job was processed)
    return res.status(200).json({
      success: result.success,
      skipped: result.skipped,
      reason: result.reason,
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('Unexpected error in generation job', {
      error: error.message,
      stack: error.stack,
      duration,
    });
    
    // Still return 200 (to prevent Vercel retries)
    return res.status(200).json({
      success: false,
      error: 'internal_error',
      duration,
    });
  }
}







