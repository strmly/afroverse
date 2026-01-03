import { Types } from 'mongoose';
import { Generation } from '../models/Generation';
import { UserSelfie } from '../models/UserSelfie';
import { Post } from '../models/Post';
import { getBucket } from '../config/storage';
import { BUCKETS } from '../config/buckets';
import { generateImage, refineImage, buildUserPrompt } from './gemini.service';
import { generateThumbnail } from '../utils/image';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Generation Service
 * 
 * Handles AI image generation pipeline:
 * - Creates generation records
 * - Enqueues async tasks
 * - Processes generations (worker)
 * - Manages versions
 */

const MAX_CONCURRENT_GENERATIONS = 2;

export interface CreateGenerationInput {
  userId: Types.ObjectId;
  selfieIds: Types.ObjectId[];
  mode: 'preset' | 'prompt' | 'try_style';
  seedPostId?: Types.ObjectId;
  presetId?: string;
  prompt?: string;
  negativePrompt?: string;
  aspect?: '1:1' | '9:16';
  quality?: 'standard' | 'high';
}

export interface CreateGenerationResult {
  success: boolean;
  generationId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Create generation and enqueue task
 */
export async function createGeneration(
  input: CreateGenerationInput
): Promise<CreateGenerationResult> {
  try {
    // Check concurrent limit
    const concurrent = await Generation.countDocuments({
      userId: input.userId,
      status: { $in: ['queued', 'running'] },
    });
    
    if (concurrent >= MAX_CONCURRENT_GENERATIONS) {
      return {
        success: false,
        error: 'Too many active generations. Please wait for current ones to complete.',
        errorCode: 'concurrent_limit',
      };
    }
    
    // Validate selfies belong to user
    const selfies = await UserSelfie.find({
      _id: { $in: input.selfieIds },
      userId: input.userId,
      status: 'active',
    });
    
    if (selfies.length !== input.selfieIds.length) {
      return {
        success: false,
        error: 'Invalid selfie IDs',
        errorCode: 'invalid_selfies',
      };
    }
    
    // If try_style mode, validate seed post
    if (input.mode === 'try_style' && input.seedPostId) {
      const seedPost = await Post.findById(input.seedPostId);
      
      if (!seedPost) {
        return {
          success: false,
          error: 'Seed post not found',
          errorCode: 'invalid_seed',
        };
      }
    }
    
    // Create generation record
    const generation = await Generation.create({
      userId: input.userId,
      source: {
        selfieIds: input.selfieIds,
        mode: input.mode,
        seedPostId: input.seedPostId || null,
      },
      style: {
        presetId: input.presetId || null,
        prompt: input.prompt || '',
        negativePrompt: input.negativePrompt || null,
        parameters: {
          aspect: input.aspect || '1:1',
          quality: input.quality || 'standard',
        },
      },
      provider: {
        name: 'gemini',
        model: input.quality === 'high' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash-image',
        requestIds: [],
      },
      status: 'queued',
      versions: [],
    });
    
    // Fire background job (Vercel-style)
    const generationId = generation._id.toString();
    
    triggerBackgroundJob({
      generationId,
      requestedVersionId: 'v1',
      type: 'initial',
    });
    
    logger.info('Generation created and queued', {
      generationId,
      userId: input.userId.toString(),
      mode: input.mode,
    });
    
    return {
      success: true,
      generationId,
    };
  } catch (error: any) {
    logger.error('Failed to create generation', error);
    return {
      success: false,
      error: 'Failed to create generation',
      errorCode: 'creation_failed',
    };
  }
}

/**
 * Trigger background job (fire-and-forget)
 */
function triggerBackgroundJob(params: {
  generationId: string;
  requestedVersionId: string;
  type: 'initial' | 'refine';
}): void {
  const jobUrl = `${env.API_URL || 'http://localhost:3001'}/api/jobs/generation`;
  
  fetch(jobUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  }).catch((error) => {
    logger.error('Failed to trigger background job', {
      generationId: params.generationId,
      error: error.message,
    });
  });
}

/**
 * Refine existing generation
 */
export async function refineGeneration(
  userId: Types.ObjectId,
  generationId: string,
  instruction: string
): Promise<CreateGenerationResult> {
  try {
    // Load generation
    const generation = await Generation.findById(generationId);
    
    if (!generation) {
      return {
        success: false,
        error: 'Generation not found',
        errorCode: 'not_found',
      };
    }
    
    // Verify ownership
    if (generation.userId.toString() !== userId.toString()) {
      return {
        success: false,
        error: 'Unauthorized',
        errorCode: 'unauthorized',
      };
    }
    
    // Verify has at least one version
    if (generation.versions.length === 0) {
      return {
        success: false,
        error: 'No versions to refine',
        errorCode: 'no_versions',
      };
    }
    
    // Check concurrent limit
    const concurrent = await Generation.countDocuments({
      userId,
      status: { $in: ['queued', 'running'] },
    });
    
    if (concurrent >= MAX_CONCURRENT_GENERATIONS) {
      return {
        success: false,
        error: 'Too many active generations',
        errorCode: 'concurrent_limit',
      };
    }
    
    // Get latest version
    const latestVersion = generation.versions[generation.versions.length - 1];
    const nextVersionNum = generation.versions.length + 1;
    const nextVersionId = `v${nextVersionNum}`;
    
    // Update status to queued
    generation.status = 'queued';
    await generation.save();
    
    // Fire background job (Vercel-style)
    triggerBackgroundJob({
      generationId: generation._id.toString(),
      requestedVersionId: nextVersionId,
      type: 'refine',
    });
    
    logger.info('Refinement queued', {
      generationId: generation._id.toString(),
      baseVersion: latestVersion.versionId,
      nextVersion: nextVersionId,
    });
    
    return {
      success: true,
      generationId: generation._id.toString(),
    };
  } catch (error: any) {
    logger.error('Failed to refine generation', error);
    return {
      success: false,
      error: 'Failed to refine generation',
      errorCode: 'refinement_failed',
    };
  }
}

/**
 * Process generation (worker)
 * 
 * This is called by the worker service when a task is processed.
 * IDEMPOTENT: Safe to call multiple times for same generation.
 */
export async function processGeneration(taskPayload: {
  generationId: string;
  type: 'initial' | 'refine';
  requestedVersionId: string;
  refine?: {
    baseVersionId: string;
    instruction: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  const { generationId, type, requestedVersionId, refine } = taskPayload;
  
  logger.info('processGeneration called', {
    generationId,
    type,
    requestedVersionId,
  });
  
  try {
    logger.info('About to load generation from DB', { generationId });
    // Step 0: Load and lock
    const generation = await Generation.findById(generationId);
    logger.info('Generation loaded from DB', { generationId, found: !!generation });
    
    if (!generation) {
      logger.error('Generation not found', { generationId });
      return { success: false, error: 'Generation not found' };
    }
    
    // Idempotency check: version already exists?
    const existingVersion = generation.versions.find(
      v => v.versionId === requestedVersionId
    );
    
    if (existingVersion) {
      logger.info('Version already exists (idempotent)', {
        generationId,
        requestedVersionId,
      });
      return { success: true };
    }
    
    // Transition to running (atomic)
    const updated = await Generation.findOneAndUpdate(
      {
        _id: generationId,
        status: { $in: ['queued', 'running'] },
      },
      {
        $set: { status: 'running', updatedAt: new Date() },
      },
      { new: true }
    );
    
    if (!updated) {
      logger.warn('Could not transition to running', { generationId });
      return { success: false, error: 'Invalid state transition' };
    }
    
    // Step 1: Fetch inputs (selfies)
    const selfieBuffers: Buffer[] = [];
    
    logger.info('Attempting to access buckets', {
      privateGallery: BUCKETS.PRIVATE_GALLERY,
      rawGenerations: BUCKETS.RAW_GENERATIONS,
      generationId,
    });
    
    let selfieBucket;
    let rawBucket;
    
    try {
      selfieBucket = getBucket(BUCKETS.PRIVATE_GALLERY);
      logger.info('Successfully got private gallery bucket', { generationId });
    } catch (err: any) {
      logger.error('Failed to get private gallery bucket', {
        generationId,
        bucket: BUCKETS.PRIVATE_GALLERY,
        error: err.message,
      });
      throw err;
    }
    
    try {
      rawBucket = getBucket(BUCKETS.RAW_GENERATIONS);
      logger.info('Successfully got raw generations bucket', { generationId });
    } catch (err: any) {
      logger.error('Failed to get raw generations bucket', {
        generationId,
        bucket: BUCKETS.RAW_GENERATIONS,
        error: err.message,
      });
      throw err;
    }
    
    logger.info('Using buckets for generation', {
      selfieBucket: BUCKETS.PRIVATE_GALLERY,
      rawBucket: BUCKETS.RAW_GENERATIONS,
      generationId,
    });
    
    for (const selfieId of generation.source.selfieIds) {
      const selfie = await UserSelfie.findById(selfieId);
      
      if (!selfie) {
        throw new Error(`Selfie not found: ${selfieId}`);
      }
      
      logger.info('Downloading selfie from GCS', {
        generationId,
        selfieId: selfieId.toString(),
        bucket: BUCKETS.PRIVATE_GALLERY,
        path: selfie.gcsPath,
      });
      
      const file = selfieBucket.file(selfie.gcsPath);
      const [buffer] = await file.download();
      selfieBuffers.push(buffer);
    }
    
    logger.info('Fetched selfies', {
      generationId,
      count: selfieBuffers.length,
    });
    
    // Step 2: Build prompt
    const userPrompt = buildUserPrompt({
      presetId: generation.style.presetId || undefined,
      userPrompt: generation.style.prompt,
      aspectRatio: generation.style.parameters.aspect,
    });
    
    // Step 3: Generate or refine
    let output: { imageData: Buffer; mimeType: string; requestId?: string };
    
    if (type === 'refine' && refine) {
      // Fetch base image from raw generations bucket
      const baseVersion = generation.versions.find(
        v => v.versionId === refine.baseVersionId
      );
      
      if (!baseVersion) {
        throw new Error(`Base version not found: ${refine.baseVersionId}`);
      }
      
      const baseFile = rawBucket.file(baseVersion.imagePath);
      const [baseBuffer] = await baseFile.download();
      
      logger.info('Refining image', {
        generationId,
        baseVersion: refine.baseVersionId,
        instruction: refine.instruction,
      });
      
      output = await refineImage({
        baseImage: baseBuffer,
        instruction: refine.instruction,
        images: selfieBuffers,
        prompt: userPrompt,
        aspectRatio: generation.style.parameters.aspect,
        quality: generation.style.parameters.quality,
      });
    } else {
      logger.info('Generating new image', {
        generationId,
        prompt: userPrompt.substring(0, 100),
      });
      
      output = await generateImage({
        prompt: userPrompt,
        images: selfieBuffers,
        aspectRatio: generation.style.parameters.aspect,
        quality: generation.style.parameters.quality,
      });
    }
    
    // Step 4: Generate thumbnail
    const thumbnail = await generateThumbnail(output.imageData);
    
    // Step 5: Upload to GCS (raw generations bucket for temporary storage)
    const imagePath = `users/${generation.userId}/generations/${generationId}/images/${requestedVersionId}.png`;
    const thumbPath = `users/${generation.userId}/generations/${generationId}/thumbs/${requestedVersionId}_w512.jpg`;
    
    logger.info('Uploading generation to GCS', {
      generationId,
      bucket: BUCKETS.RAW_GENERATIONS,
      imagePath,
      thumbPath,
    });
    
    const imageFile = rawBucket.file(imagePath);
    const thumbFile = rawBucket.file(thumbPath);
    
    await imageFile.save(output.imageData, {
      contentType: output.mimeType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    await thumbFile.save(thumbnail, {
      contentType: 'image/jpeg',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    logger.info('Uploaded to GCS successfully', {
      generationId,
      bucket: BUCKETS.RAW_GENERATIONS,
      imagePath,
      thumbPath,
    });
    
    // Step 6: Append version to generation
    await (generation as any).addVersion({
      versionId: requestedVersionId,
      imagePath,
      thumbPath,
    });
    
    // Mark succeeded if first version
    if (generation.versions.length === 1) {
      await (generation as any).markSucceeded();
    }
    
    // Add request ID
    if (output.requestId) {
      generation.provider.requestIds.push(output.requestId);
      await generation.save();
    }
    
    logger.info('Generation completed successfully', {
      generationId,
      requestedVersionId,
      versionsCount: generation.versions.length,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Generation processing failed', {
      generationId,
      error: error.message,
    });
    
    // Mark generation as failed
    try {
      const generation = await Generation.findById(generationId);
      
      if (generation) {
        let errorCode = 'generation_failed';
        
        if (error.message === 'BLOCKED') {
          errorCode = 'blocked';
        } else if (error.message === 'RATE_LIMITED') {
          errorCode = 'rate_limited';
        }
        
        await (generation as any).markFailed(errorCode, error.message);
      }
    } catch (updateError) {
      logger.error('Failed to mark generation as failed', updateError);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Get generation by ID
 */
export async function getGeneration(userId: Types.ObjectId, generationId: string) {
  const generation = await Generation.findById(generationId);
  
  if (!generation) {
    return null;
  }
  
  // Verify ownership
  if (generation.userId.toString() !== userId.toString()) {
    return null;
  }
  
  return generation;
}

/**
 * Get user's generations
 */
export async function getUserGenerations(
  userId: Types.ObjectId,
  limit: number = 20,
  before?: Date
) {
  const query: any = { userId };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return Generation.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
}

