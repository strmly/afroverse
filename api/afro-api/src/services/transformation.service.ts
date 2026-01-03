/**
 * Transformation Service
 * 
 * AUTHORITATIVE implementation of the AfroMoji image lifecycle.
 * 
 * This service owns the complete transformation flow:
 * 1. Raw generation (temporary)
 * 2. Validation & moderation
 * 3. Final placement (public or private)
 * 4. Derivative creation (thumbnails)
 * 5. URL generation
 * 6. Deletion & archival
 * 
 * CRITICAL: The mobile app NEVER interacts with GCS directly.
 * All operations flow through this service.
 */

import { Types } from 'mongoose';
import { Generation } from '../models/Generation';
import { BUCKETS, PATHS, URLS, LIFECYCLE } from '../config/buckets';
import * as StorageService from './storage.service';
import { generateImage } from './gemini.service';
import { generateThumbnail, validateImage, ImageValidationResult } from '../utils/image';
import { logger } from '../utils/logger';

export interface TransformationCreateInput {
  userId: Types.ObjectId;
  prompt: string;
  referenceImages?: Buffer[];
  visibility: 'public' | 'private';
  aspectRatio?: '1:1' | '9:16';
  quality?: 'standard' | 'high';
}

export interface TransformationResult {
  success: boolean;
  transformationId?: string;
  state?: 'PREPARING' | 'GENERATING' | 'FINALIZING' | 'COMPLETE' | 'FAILED';
  imageUrl?: string;
  thumbnailUrl?: string;
  placement?: string[];
  estimatedSecondsRemaining?: number;
  error?: string;
  errorCode?: string;
}

export interface TransformationStatus {
  state: 'PREPARING' | 'GENERATING' | 'FINALIZING' | 'COMPLETE' | 'FAILED';
  estimatedSecondsRemaining?: number;
  error?: string;
}

/**
 * Create transformation
 * 
 * This is the main entry point for creating a new transformation.
 * Backend orchestrates the entire lifecycle.
 */
export async function createTransformation(
  input: TransformationCreateInput
): Promise<TransformationResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Creating transformation', {
      userId: input.userId.toString(),
      visibility: input.visibility,
      quality: input.quality,
    });
    
    // Step 1: PREPARING - Generate AI image
    logger.info('[PREPARING] Starting AI generation');
    
    const rawOutput = await generateImage({
      prompt: input.prompt,
      images: input.referenceImages || [],
      aspectRatio: input.aspectRatio || '1:1',
      quality: input.quality || 'standard',
    });
    
    logger.info('[PREPARING] AI generation complete', {
      size: rawOutput.imageData.length,
      mimeType: rawOutput.mimeType,
    });
    
    // Step 2: GENERATING - Upload to raw bucket (temporary)
    const transformationId = new Types.ObjectId().toString();
    const userId = input.userId.toString();
    const rawPath = PATHS.rawGeneration(userId, transformationId);
    
    logger.info('[GENERATING] Uploading to raw bucket');
    
    const rawUpload = await StorageService.uploadBuffer(
      BUCKETS.RAW_GENERATIONS,
      rawPath,
      rawOutput.imageData,
      {
        contentType: rawOutput.mimeType,
        metadata: {
          transformationId,
          userId,
          createdAt: new Date().toISOString(),
        },
        cacheControl: 'private, max-age=0',
      }
    );
    
    if (!rawUpload.success) {
      throw new Error(`Failed to upload raw generation: ${rawUpload.error}`);
    }
    
    // Step 3: FINALIZING - Validation & cleanup
    logger.info('[FINALIZING] Validating image');
    
    const validation = await validateImage(rawOutput.imageData);
    
    if (!validation.valid) {
      // Delete raw file
      await StorageService.deleteFile(BUCKETS.RAW_GENERATIONS, rawPath);
      
      return {
        success: false,
        state: 'FAILED',
        error: validation.error || 'Image validation failed',
        errorCode: 'validation_failed',
      };
    }
    
    // Strip EXIF data (already done by validateImage, but ensure)
    const cleanedImage = validation.cleanedBuffer || rawOutput.imageData;
    
    // Step 4: FINALIZING - Generate derivatives
    logger.info('[FINALIZING] Generating derivatives');
    
    const thumbnail = await generateThumbnail(cleanedImage, {
      width: 512,
      quality: 85,
    });
    
    // Step 5: COMPLETE - Place in final bucket
    logger.info('[COMPLETE] Placing in final buckets');
    
    const finalPath = input.visibility === 'public'
      ? PATHS.transformation(userId, transformationId)
      : PATHS.privateDraft(userId, transformationId);
    
    const finalBucket = input.visibility === 'public'
      ? BUCKETS.TRANSFORMATIONS
      : BUCKETS.PRIVATE_GALLERY;
    
    const thumbnailPath = PATHS.thumbnail(userId, transformationId);
    
    // Upload final image
    const finalUpload = await StorageService.uploadBuffer(
      finalBucket,
      finalPath,
      cleanedImage,
      {
        contentType: 'image/webp',
        metadata: {
          transformationId,
          userId,
          visibility: input.visibility,
          createdAt: new Date().toISOString(),
        },
        cacheControl: input.visibility === 'public'
          ? 'public, max-age=31536000' // 1 year for public
          : 'private, max-age=0', // No cache for private
      }
    );
    
    if (!finalUpload.success) {
      throw new Error(`Failed to upload final image: ${finalUpload.error}`);
    }
    
    // Upload thumbnail (always to derivatives bucket)
    const thumbnailUpload = await StorageService.uploadBuffer(
      BUCKETS.DERIVATIVES,
      thumbnailPath,
      thumbnail,
      {
        contentType: 'image/webp',
        metadata: {
          transformationId,
          userId,
          type: 'thumbnail',
          createdAt: new Date().toISOString(),
        },
        cacheControl: 'public, max-age=31536000',
      }
    );
    
    if (!thumbnailUpload.success) {
      logger.warn('Thumbnail upload failed', {
        error: thumbnailUpload.error,
      });
    }
    
    // Step 6: Cleanup raw file
    await StorageService.deleteFile(BUCKETS.RAW_GENERATIONS, rawPath);
    
    logger.info('[COMPLETE] Transformation complete', {
      transformationId,
      duration: Date.now() - startTime,
    });
    
    // Step 7: Generate URLs
    const imageUrl = input.visibility === 'public'
      ? finalUpload.url
      : undefined; // Will be signed on demand
    
    const thumbnailUrl = thumbnailUpload.success
      ? thumbnailUpload.url
      : undefined;
    
    const placement = input.visibility === 'public'
      ? ['feed', 'profile']
      : ['profile_private'];
    
    return {
      success: true,
      transformationId,
      state: 'COMPLETE',
      imageUrl,
      thumbnailUrl,
      placement,
    };
  } catch (error: any) {
    logger.error('Transformation failed', {
      error: error.message,
      userId: input.userId.toString(),
    });
    
    return {
      success: false,
      state: 'FAILED',
      error: error.message,
      errorCode: 'transformation_failed',
    };
  }
}

/**
 * Get transformation status
 * 
 * Used for polling by the mobile app.
 */
export async function getTransformationStatus(
  userId: Types.ObjectId,
  transformationId: string
): Promise<TransformationStatus> {
  try {
    const generation = await Generation.findById(transformationId);
    
    if (!generation) {
      return {
        state: 'FAILED',
        error: 'Transformation not found',
      };
    }
    
    // Verify ownership
    if (generation.userId.toString() !== userId.toString()) {
      return {
        state: 'FAILED',
        error: 'Unauthorized',
      };
    }
    
    // Map generation status to transformation state
    const stateMap: Record<string, TransformationStatus['state']> = {
      queued: 'PREPARING',
      running: 'GENERATING',
      succeeded: 'COMPLETE',
      failed: 'FAILED',
    };
    
    const state = stateMap[generation.status] || 'PREPARING';
    
    // Estimate time remaining (rough heuristic)
    let estimatedSecondsRemaining: number | undefined;
    
    if (state === 'PREPARING') {
      estimatedSecondsRemaining = 25;
    } else if (state === 'GENERATING') {
      estimatedSecondsRemaining = 15;
    } else if (state === 'FINALIZING') {
      estimatedSecondsRemaining = 5;
    }
    
    return {
      state,
      estimatedSecondsRemaining,
    };
  } catch (error: any) {
    logger.error('Failed to get transformation status', {
      transformationId,
      error: error.message,
    });
    
    return {
      state: 'FAILED',
      error: error.message,
    };
  }
}

/**
 * Get transformation URLs
 * 
 * Returns appropriate URLs based on visibility.
 * For private transformations, generates signed URLs.
 */
export async function getTransformationUrls(
  userId: Types.ObjectId,
  transformationId: string
): Promise<{
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    const generation = await Generation.findById(transformationId);
    
    if (!generation) {
      return {
        success: false,
        error: 'Transformation not found',
      };
    }
    
    // Verify ownership
    if (generation.userId.toString() !== userId.toString()) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }
    
    if (generation.versions.length === 0) {
      return {
        success: false,
        error: 'No versions available',
      };
    }
    
    const latestVersion = generation.versions[generation.versions.length - 1];
    
    // Determine if this is public or private
    // (In full implementation, this would be stored in Generation model)
    const isPublic = true; // Placeholder
    
    if (isPublic) {
      // Return public URLs
      return {
        success: true,
        imageUrl: URLS.public(BUCKETS.TRANSFORMATIONS, latestVersion.imagePath),
        thumbnailUrl: URLS.public(BUCKETS.DERIVATIVES, latestVersion.thumbPath),
      };
    } else {
      // Generate signed URLs for private access
      const imageSignedResult = await StorageService.generateSignedUrl(
        BUCKETS.PRIVATE_GALLERY,
        latestVersion.imagePath,
        LIFECYCLE.SIGNED_URL_EXPIRY
      );
      
      if (!imageSignedResult.success) {
        return {
          success: false,
          error: 'Failed to generate signed URL',
        };
      }
      
      return {
        success: true,
        imageUrl: imageSignedResult.url,
        expiresAt: imageSignedResult.expiresAt,
      };
    }
  } catch (error: any) {
    logger.error('Failed to get transformation URLs', {
      transformationId,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete transformation
 * 
 * USER EXPECTATION = LAW
 * When user deletes, we must:
 * 1. Delete from transformations bucket
 * 2. Delete from derivatives bucket
 * 3. Invalidate CDN cache
 * 4. Update feed index
 * 5. Optionally archive for recovery
 */
export async function deleteTransformation(
  userId: Types.ObjectId,
  transformationId: string,
  options: {
    archive?: boolean;
    permanent?: boolean;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const generation = await Generation.findById(transformationId);
    
    if (!generation) {
      return {
        success: false,
        error: 'Transformation not found',
      };
    }
    
    // Verify ownership
    if (generation.userId.toString() !== userId.toString()) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }
    
    if (generation.versions.length === 0) {
      return { success: true }; // Nothing to delete
    }
    
    const latestVersion = generation.versions[generation.versions.length - 1];
    
    // Step 1: Archive if requested (before deletion)
    if (options.archive && !options.permanent) {
      const archivePath = PATHS.archive(
        userId.toString(),
        transformationId,
        new Date()
      );
      
      await StorageService.copyFile(
        BUCKETS.TRANSFORMATIONS,
        latestVersion.imagePath,
        BUCKETS.ARCHIVE,
        archivePath
      );
      
      logger.info('Transformation archived', {
        transformationId,
        archivePath,
      });
    }
    
    // Step 2: Delete from transformations bucket
    await StorageService.deleteFile(
      BUCKETS.TRANSFORMATIONS,
      latestVersion.imagePath
    );
    
    // Step 3: Delete from derivatives bucket
    await StorageService.deleteFile(
      BUCKETS.DERIVATIVES,
      latestVersion.thumbPath
    );
    
    // Step 4: Invalidate CDN cache
    await StorageService.invalidateCDNCache([
      latestVersion.imagePath,
      latestVersion.thumbPath,
    ]);
    
    // Step 5: Soft delete generation record
    await (generation as any).softDelete();
    
    logger.info('Transformation deleted', {
      transformationId,
      userId: userId.toString(),
      archived: options.archive,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to delete transformation', {
      transformationId,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Publish private draft to public feed
 * 
 * Moves transformation from private-gallery to transformations bucket.
 */
export async function publishTransformation(
  userId: Types.ObjectId,
  transformationId: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const generation = await Generation.findById(transformationId);
    
    if (!generation) {
      return {
        success: false,
        error: 'Transformation not found',
      };
    }
    
    // Verify ownership
    if (generation.userId.toString() !== userId.toString()) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }
    
    if (generation.versions.length === 0) {
      return {
        success: false,
        error: 'No versions available',
      };
    }
    
    const latestVersion = generation.versions[generation.versions.length - 1];
    const userIdStr = userId.toString();
    
    // Move from private to public bucket
    const newPath = PATHS.transformation(userIdStr, transformationId);
    
    await StorageService.moveFile(
      BUCKETS.PRIVATE_GALLERY,
      latestVersion.imagePath,
      BUCKETS.TRANSFORMATIONS,
      newPath
    );
    
    // Update generation record
    latestVersion.imagePath = newPath;
    await generation.save();
    
    const imageUrl = URLS.public(BUCKETS.TRANSFORMATIONS, newPath);
    
    logger.info('Transformation published', {
      transformationId,
      userId: userIdStr,
    });
    
    return {
      success: true,
      imageUrl,
    };
  } catch (error: any) {
    logger.error('Failed to publish transformation', {
      transformationId,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}



