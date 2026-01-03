import { Types } from 'mongoose';
import { Generation } from '../models/Generation';
import { UserSelfie } from '../models/UserSelfie';
import { User } from '../models/User';
import { getBucket } from '../config/storage';
import { BUCKETS } from '../config/buckets';
import { generateImage } from './gemini.service';
import { uploadImageToGCS } from '../utils/image';
import { logger } from '../utils/logger';
import { calculateRetryAfter, isRetryableError, isNonRetryableError } from '../utils/backoff';

/**
 * Generation Job Service (Vercel-Native)
 * 
 * Handles idempotent, retryable generation execution.
 * Designed for Vercel Background Functions.
 */

export interface ExecuteGenerationParams {
  generationId: string;
  requestedVersionId: string;
  type: 'initial' | 'refine';
  requestId: string; // For locking
}

export interface ExecutionResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

/**
 * Execute generation job (IDEMPOTENT)
 * 
 * This is the core worker logic, designed to be called multiple times safely.
 */
export async function executeGeneration(
  params: ExecuteGenerationParams
): Promise<ExecutionResult> {
  const { generationId, requestedVersionId, type, requestId } = params;
  
  try {
    // STEP 0: Load generation
    const generation = await Generation.findById(generationId);
    
    if (!generation) {
      logger.warn('Generation not found (job is dead)', { generationId });
      return { success: true, skipped: true, reason: 'generation_not_found' };
    }
    
    // STEP 1: Version idempotency check (FIRST)
    const versionExists = generation.versions.some(
      (v) => v.versionId === requestedVersionId
    );
    
    if (versionExists) {
      logger.info('Version already exists (idempotent)', {
        generationId,
        requestedVersionId,
      });
      return { success: true, skipped: true, reason: 'version_exists' };
    }
    
    // STEP 2: Retry gate
    if (generation.retryAfter && new Date() < generation.retryAfter) {
      logger.info('Too early to retry', {
        generationId,
        retryAfter: generation.retryAfter,
      });
      return { success: true, skipped: true, reason: 'retry_gate' };
    }
    
    // STEP 3: Acquire lock (atomic)
    const lockAcquired = await acquireLock(generationId, requestedVersionId, requestId);
    
    if (!lockAcquired) {
      logger.info('Lock not acquired (another execution owns it)', {
        generationId,
        requestId,
      });
      return { success: true, skipped: true, reason: 'lock_not_acquired' };
    }
    
    logger.info('Lock acquired, starting execution', {
      generationId,
      requestedVersionId,
      attempt: generation.attempts + 1,
    });
    
    // STEP 4: Execute generation (unsafe zone)
    try {
      const result = await performGeneration(generation, requestedVersionId);
      
      // STEP 5: Append version (conditional)
      const versionAppended = await appendVersion(
        generationId,
        requestedVersionId,
        result
      );
      
      if (!versionAppended) {
        logger.info('Version already appended by another execution', {
          generationId,
          requestedVersionId,
        });
        return { success: true, skipped: true, reason: 'version_already_appended' };
      }
      
      // STEP 6: Mark succeeded
      await markSucceeded(generationId);
      
      logger.info('Generation succeeded', {
        generationId,
        requestedVersionId,
      });
      
      return { success: true };
    } catch (error: any) {
      // STEP 7: Handle failure
      await handleFailure(generationId, error, generation.attempts + 1);
      
      logger.error('Generation failed', {
        generationId,
        requestedVersionId,
        error: error.message,
        code: error.code,
      });
      
      return { success: false, error: error.message };
    }
  } catch (error: any) {
    logger.error('Unexpected error in executeGeneration', {
      generationId,
      error: error.message,
    });
    
    // Try to release lock
    try {
      await Generation.findByIdAndUpdate(generationId, {
        $set: {
          lockedBy: null,
          lockedAt: null,
        },
      });
    } catch (unlockError) {
      // Best effort
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Acquire lock (atomic)
 * 
 * Returns true if lock was acquired, false otherwise.
 */
async function acquireLock(
  generationId: string,
  requestedVersionId: string,
  requestId: string
): Promise<boolean> {
  const lockTimeout = 15 * 60 * 1000; // 15 minutes
  const lockExpiry = new Date(Date.now() - lockTimeout);
  
  const result = await Generation.updateOne(
    {
      _id: generationId,
      $and: [
        {
          $or: [
            { lockedAt: null },
            { lockedAt: { $lt: lockExpiry } },
          ],
        },
        {
          'versions.versionId': { $ne: requestedVersionId },
        },
      ],
    },
    {
      $set: {
        status: 'running',
        lockedBy: requestId,
        lockedAt: new Date(),
      },
      $inc: {
        attempts: 1,
      },
      $currentDate: {
        lastAttemptAt: true,
      },
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Perform the actual generation
 */
async function performGeneration(
  generation: any,
  versionId: string
): Promise<{
  imagePath: string;
  thumbPath: string;
  watermarkedImagePath?: string;
  watermarkedThumbPath?: string;
  cleanImagePath?: string;
  cleanThumbPath?: string;
  hasWatermark: boolean;
}> {
  // Check if user is banned
  const user = await User.findById(generation.userId).select('status').lean();
  
  if (user?.status?.banned || user?.status?.shadowbanned) {
    const error: any = new Error('User is banned');
    error.code = 'banned_user';
    throw error;
  }
  
  // Fetch selfies from GCS (from private gallery)
  const selfieBuffers: Buffer[] = [];
  const selfieBucket = getBucket(BUCKETS.PRIVATE_GALLERY);
  
  for (const selfieId of generation.source.selfieIds) {
    const selfie = await UserSelfie.findById(selfieId).lean();
    
    if (!selfie || !selfie.gcsPath) {
      const error: any = new Error('Selfie not found or incomplete');
      error.code = 'missing_selfies';
      throw error;
    }
    
    // Download selfie from GCS
    const file = selfieBucket.file(selfie.gcsPath);
    const [buffer] = await file.download();
    
    selfieBuffers.push(buffer);
  }
  
  // Generate image with Gemini
  const result = await generateImage({
    prompt: generation.style.prompt,
    images: selfieBuffers,
    aspectRatio: generation.style.parameters.aspect,
    quality: generation.style.parameters.quality,
  });
  
  const imageBuffer = result.imageData;
  
  // Upload to GCS with watermarking
  const userId = generation.userId.toString();
  const generationId = generation._id.toString();
  const timestamp = Date.now();
  
  const basePath = `generations/${userId}/${generationId}`;
  const imagePath = `${basePath}/${versionId}_${timestamp}.webp`;
  const thumbPath = `${basePath}/${versionId}_${timestamp}_thumb.webp`;
  
  // Upload with watermarks (default: public visibility)
  const uploadResult = await uploadImageToGCS(imageBuffer, imagePath, thumbPath, {
    transformationId: generationId,
    applyWatermark: true,
    visibilityType: 'public',
  });
  
  // Use watermarked paths as the primary paths (these are the files that actually exist)
  const watermarkedImagePath = uploadResult.watermarkedPath || imagePath.replace(/(\.[^.]+)$/, '_wm$1');
  const watermarkedThumbPath = thumbPath.replace(/(\.[^.]+)$/, '_wm$1');
  const cleanImagePath = uploadResult.cleanPath || imagePath.replace(/(\.[^.]+)$/, '_clean$1');
  const cleanThumbPath = thumbPath.replace(/(\.[^.]+)$/, '_clean$1');
  
  return {
    imagePath: watermarkedImagePath, // Store the watermarked path as the main path
    thumbPath: watermarkedThumbPath,
    watermarkedImagePath,
    watermarkedThumbPath,
    cleanImagePath,
    cleanThumbPath,
    hasWatermark: true,
  };
}

/**
 * Append version (conditional)
 * 
 * Returns true if version was appended, false if it already exists.
 */
async function appendVersion(
  generationId: string,
  versionId: string,
  data: {
    imagePath: string;
    thumbPath: string;
    watermarkedImagePath?: string;
    watermarkedThumbPath?: string;
    cleanImagePath?: string;
    cleanThumbPath?: string;
    hasWatermark: boolean;
  }
): Promise<boolean> {
  const result = await Generation.updateOne(
    {
      _id: generationId,
      'versions.versionId': { $ne: versionId },
    },
    {
      $push: {
        versions: {
          versionId,
          imagePath: data.imagePath,
          thumbPath: data.thumbPath,
          watermarkedImagePath: data.watermarkedImagePath,
          watermarkedThumbPath: data.watermarkedThumbPath,
          cleanImagePath: data.cleanImagePath,
          cleanThumbPath: data.cleanThumbPath,
          hasWatermark: data.hasWatermark,
          createdAt: new Date(),
        },
      },
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Mark generation as succeeded
 */
async function markSucceeded(generationId: string): Promise<void> {
  await Generation.findByIdAndUpdate(generationId, {
    $set: {
      status: 'succeeded',
      lockedBy: null,
      lockedAt: null,
    },
  });
}

/**
 * Handle failure with retry logic
 */
async function handleFailure(
  generationId: string,
  error: any,
  attempts: number
): Promise<void> {
  const generation = await Generation.findById(generationId);
  
  if (!generation) return;
  
  // Determine if retryable
  const retryable = !isNonRetryableError(error) && isRetryableError(error);
  
  // Check if max attempts exceeded
  const maxAttemptsExceeded = attempts >= generation.maxAttempts;
  
  let status: 'queued' | 'failed';
  let retryAfter: Date | null = null;
  
  if (retryable && !maxAttemptsExceeded) {
    status = 'queued';
    retryAfter = calculateRetryAfter(attempts);
    
    logger.info('Generation will be retried', {
      generationId,
      attempts,
      retryAfter,
    });
  } else {
    status = 'failed';
    
    const errorCode = maxAttemptsExceeded 
      ? 'max_retries_exceeded' 
      : error.code || 'unknown_error';
    
    await Generation.findByIdAndUpdate(generationId, {
      $set: {
        status,
        lockedBy: null,
        lockedAt: null,
        error: {
          code: errorCode,
          message: error.message,
          retryable: false,
        },
      },
    });
    
    logger.warn('Generation marked as failed', {
      generationId,
      errorCode,
      maxAttemptsExceeded,
    });
    
    return;
  }
  
  await Generation.findByIdAndUpdate(generationId, {
    $set: {
      status,
      retryAfter,
      lockedBy: null,
      lockedAt: null,
      error: {
        code: error.code || 'unknown_error',
        message: error.message,
        retryable: true,
      },
    },
  });
}

/**
 * Find generations that need retry/recovery
 * 
 * Used by cron job
 */
export async function findGenerationsNeedingRetry(): Promise<string[]> {
  const lockTimeout = 15 * 60 * 1000; // 15 minutes
  const lockExpiry = new Date(Date.now() - lockTimeout);
  const now = new Date();
  
  const generations = await Generation.find({
    status: { $in: ['queued', 'running'] },
    attempts: { $lt: 5 }, // maxAttempts
    $or: [
      // Queued jobs ready to retry
      {
        status: 'queued',
        $or: [
          { retryAfter: null },
          { retryAfter: { $lte: now } },
        ],
      },
      // Stuck running jobs
      {
        status: 'running',
        lockedAt: { $lt: lockExpiry },
      },
    ],
  })
    .select('_id')
    .limit(100) // Process in batches
    .lean();
  
  return generations.map((g) => g._id.toString());
}

