import { Request, Response } from 'express';
import { findGenerationsNeedingRetry } from '../services/generationJob.service';
import { Generation } from '../models/Generation';
import { logger } from '../utils/logger';
import { env as config } from '../config/env';

/**
 * Cron Controller (Vercel Cron)
 * 
 * Handles scheduled retry/recovery tasks.
 */

/**
 * GET /cron/generation-retry
 * 
 * Find and trigger retry for stalled/queued generations.
 * 
 * Run every minute via Vercel Cron.
 */
export async function generationRetry(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Verify cron auth (Vercel sends a special header)
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`;
    
    if (authHeader !== expectedAuth) {
      logger.warn('Unauthorized cron request', {
        ip: req.ip,
        headers: req.headers,
      });
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid cron authorization',
      });
    }
    
    logger.info('Cron: generation-retry started');
    
    // Find generations needing retry
    const generationIds = await findGenerationsNeedingRetry();
    
    if (generationIds.length === 0) {
      logger.info('Cron: no generations need retry');
      return res.status(200).json({
        triggered: 0,
        duration: Date.now() - startTime,
      });
    }
    
    logger.info('Cron: found generations to retry', {
      count: generationIds.length,
    });
    
    // Trigger jobs for each generation
    let triggered = 0;
    let failed = 0;
    
    for (const generationId of generationIds) {
      try {
        const generation = await Generation.findById(generationId)
          .select('versions')
          .lean();
        
        if (!generation) continue;
        
        // Determine next version ID
        const nextVersionNum = generation.versions.length + 1;
        const requestedVersionId = `v${nextVersionNum}`;
        
        // Fire background job (don't await)
        const jobUrl = `${config.API_URL || 'http://localhost:3001'}/api/jobs/generation`;
        
        fetch(jobUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            generationId,
            requestedVersionId,
            type: 'initial',
          }),
        }).catch((error) => {
          logger.error('Failed to trigger job', {
            generationId,
            error: error.message,
          });
        });
        
        triggered++;
      } catch (error: any) {
        logger.error('Failed to process generation in cron', {
          generationId,
          error: error.message,
        });
        failed++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Cron: generation-retry completed', {
      found: generationIds.length,
      triggered,
      failed,
      duration,
    });
    
    return res.status(200).json({
      found: generationIds.length,
      triggered,
      failed,
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('Cron: generation-retry failed', {
      error: error.message,
      stack: error.stack,
      duration,
    });
    
    return res.status(500).json({
      error: 'internal_error',
      message: 'Cron job failed',
      duration,
    });
  }
}

