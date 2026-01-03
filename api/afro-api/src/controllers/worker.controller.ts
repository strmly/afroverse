import { Request, Response } from 'express';
import { processGeneration } from '../services/generation.service';
import { logger } from '../utils/logger';

/**
 * Worker Controller
 * 
 * Handles async generation processing tasks.
 * Called by Cloud Tasks or directly in development mode.
 */

/**
 * POST /worker/process-generation
 * 
 * Process generation task (idempotent)
 */
export async function handleProcessGeneration(req: Request, res: Response) {
  try {
    const payload = req.body;
    
    // Validate payload
    if (!payload.generationId || !payload.type || !payload.requestedVersionId) {
      logger.error('Invalid task payload', payload);
      return res.status(400).json({
        error: 'invalid_payload',
        message: 'Missing required fields',
      });
    }
    
    logger.info('Processing generation task', {
      generationId: payload.generationId,
      type: payload.type,
      requestedVersionId: payload.requestedVersionId,
    });
    
    // Process generation (idempotent)
    const result = await processGeneration(payload);
    
    if (!result.success) {
      logger.error('Generation processing failed', {
        generationId: payload.generationId,
        error: result.error,
      });
      
      // Return 500 so Cloud Tasks retries (if retriable error)
      // For non-retriable errors (like BLOCKED), we already marked as failed
      if (result.error === 'BLOCKED') {
        return res.status(200).json({
          message: 'Generation blocked (non-retriable)',
        });
      }
      
      return res.status(500).json({
        error: 'processing_failed',
        message: result.error,
      });
    }
    
    logger.info('Generation processed successfully', {
      generationId: payload.generationId,
    });
    
    return res.status(200).json({
      message: 'Generation processed successfully',
    });
  } catch (error: any) {
    logger.error('Error in handleProcessGeneration', error);
    
    // Return 500 for retry
    return res.status(500).json({
      error: 'internal_error',
      message: error.message,
    });
  }
}







