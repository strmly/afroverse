import { Types } from 'mongoose';
import { getBucket } from '../config/storage';
import { UserSelfie } from '../models/UserSelfie';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { uploadBuffer } from './storage.service';
import { validateImage } from '../utils/image';
import { BUCKETS } from '../config/buckets';

/**
 * Media Service
 * 
 * Handles selfie upload pipeline with GCS:
 * - Generates signed upload URLs
 * - Validates uploaded objects
 * - Manages selfie lifecycle
 */

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const MIN_WIDTH = 512;
const MIN_HEIGHT = 512;
const SIGNED_URL_EXPIRY = 10 * 60; // 10 minutes

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface InitUploadResult {
  success: boolean;
  selfieId?: string;
  uploadUrl?: string;
  headers?: Record<string, string>;
  error?: string;
  errorCode?: string;
}

export interface CompleteUploadResult {
  success: boolean;
  status?: string;
  selfie?: any;
  error?: string;
  errorCode?: string;
}

/**
 * Generate object path for selfie
 */
export function generateSelfiePath(
  userId: Types.ObjectId,
  selfieId: Types.ObjectId,
  mimeType: string
): string {
  const extension = mimeType === 'image/png' ? 'png' : 
                   mimeType === 'image/webp' ? 'webp' : 'jpg';
  
  return `users/${userId}/selfies/${selfieId}/original.${extension}`;
}

/**
 * Initialize selfie upload
 * 
 * Creates selfie record and generates signed upload URL
 */
export async function initSelfieUpload(
  userId: Types.ObjectId,
  mimeType: string
): Promise<InitUploadResult> {
  try {
    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        errorCode: 'invalid_mime_type',
      };
    }
    
    // Generate selfie ID
    const selfieId = new Types.ObjectId();
    
    // Generate GCS path
    const gcsPath = generateSelfiePath(userId, selfieId, mimeType);
    
    // Create selfie record (initiated state)
    // Note: width and height are set to undefined initially (will be set on complete)
    // The schema allows undefined for initiated state
    const selfie = await UserSelfie.create({
      _id: selfieId,
      userId,
      gcsPath,
      mimeType,
      status: 'initiated',
      sizeBytes: 0, // Will be updated on complete
      // width and height will be set when upload completes
    });
    
    // Generate signed upload URL
    const bucket = getBucket();
    const file = bucket.file(gcsPath);
    
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + SIGNED_URL_EXPIRY * 1000,
      contentType: mimeType,
      extensionHeaders: {
        'x-goog-content-length-range': `0,${MAX_FILE_SIZE}`,
      },
    });
    
    logger.info(`Selfie upload initiated`, {
      userId: userId.toString(),
      selfieId: selfieId.toString(),
      gcsPath,
    });
    
    return {
      success: true,
      selfieId: selfieId.toString(),
      uploadUrl,
      headers: {
        'Content-Type': mimeType,
      },
    };
  } catch (error: any) {
    logger.error('Failed to init selfie upload', error);
    return {
      success: false,
      error: 'Failed to initialize upload',
      errorCode: 'init_failed',
    };
  }
}

/**
 * Complete selfie upload
 * 
 * Verifies uploaded object and activates selfie
 */
export async function completeSelfieUpload(
  userId: Types.ObjectId,
  selfieId: string,
  clientMetadata: {
    width: number;
    height: number;
    sizeBytes: number;
  }
): Promise<CompleteUploadResult> {
  try {
    // Load selfie
    const selfie = await UserSelfie.findById(selfieId);
    
    if (!selfie) {
      return {
        success: false,
        error: 'Selfie not found',
        errorCode: 'not_found',
      };
    }
    
    // Verify ownership
    if (selfie.userId.toString() !== userId.toString()) {
      return {
        success: false,
        error: 'Unauthorized',
        errorCode: 'unauthorized',
      };
    }
    
    // Check if already active (idempotency)
    if (selfie.status === 'active') {
      logger.info(`Selfie already active (idempotent)`, { selfieId });
      return {
        success: true,
        status: 'active',
        selfie: selfie.toObject(),
      };
    }
    
    // Verify status is initiated
    if (selfie.status !== 'initiated') {
      return {
        success: false,
        error: 'Invalid selfie status',
        errorCode: 'invalid_status',
      };
    }
    
    // Verify object exists in GCS
    const bucket = getBucket();
    const file = bucket.file(selfie.gcsPath);
    
    const [exists] = await file.exists();
    
    if (!exists) {
      await selfie.updateOne({ status: 'invalid' });
      
      return {
        success: false,
        error: 'Upload not found. Please try again.',
        errorCode: 'upload_missing',
      };
    }
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    
    const actualSize = parseInt(String(metadata.size || '0'), 10);
    const actualContentType = metadata.contentType;
    
    // Validate size
    if (actualSize > MAX_FILE_SIZE) {
      await selfie.updateOne({ status: 'invalid' });
      await file.delete().catch(() => {}); // Cleanup
      
      return {
        success: false,
        error: 'File too large. Maximum size is 8MB.',
        errorCode: 'file_too_large',
      };
    }
    
    // Validate content type
    if (actualContentType !== selfie.mimeType) {
      await selfie.updateOne({ status: 'invalid' });
      await file.delete().catch(() => {});
      
      return {
        success: false,
        error: 'Invalid file type',
        errorCode: 'invalid_mime',
      };
    }
    
    // Validate dimensions (use client-reported, but could verify with image processing)
    if (clientMetadata.width < MIN_WIDTH || clientMetadata.height < MIN_HEIGHT) {
      await selfie.updateOne({ status: 'invalid' });
      await file.delete().catch(() => {});
      
      return {
        success: false,
        error: `Image too small. Minimum size is ${MIN_WIDTH}x${MIN_HEIGHT}px.`,
        errorCode: 'invalid_dimensions',
      };
    }
    
    // Validate aspect ratio (reject extremely wide/tall images)
    const aspectRatio = clientMetadata.width / clientMetadata.height;
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      await selfie.updateOne({ status: 'invalid' });
      await file.delete().catch(() => {});
      
      return {
        success: false,
        error: 'Invalid image aspect ratio',
        errorCode: 'invalid_aspect',
      };
    }
    
    // All validations passed - activate selfie
    selfie.width = clientMetadata.width;
    selfie.height = clientMetadata.height;
    selfie.sizeBytes = actualSize;
    selfie.status = 'active';
    await selfie.save();
    
    logger.info(`Selfie upload completed`, {
      userId: userId.toString(),
      selfieId: selfieId.toString(),
      width: clientMetadata.width,
      height: clientMetadata.height,
      sizeBytes: actualSize,
    });
    
    return {
      success: true,
      status: 'active',
      selfie: selfie.toObject(),
    };
  } catch (error: any) {
    logger.error('Failed to complete selfie upload', error);
    return {
      success: false,
      error: 'Failed to complete upload',
      errorCode: 'complete_failed',
    };
  }
}

/**
 * Delete selfie
 */
export async function deleteSelfie(
  userId: Types.ObjectId,
  selfieId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const selfie = await UserSelfie.findById(selfieId);
    
    if (!selfie) {
      return { success: false, error: 'Selfie not found' };
    }
    
    // Verify ownership
    if (selfie.userId.toString() !== userId.toString()) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Soft delete
    await (selfie as any).softDelete();
    
    // Optionally delete from GCS (async, don't wait)
    const bucket = getBucket();
    const file = bucket.file(selfie.gcsPath);
    file.delete().catch((err) => {
      logger.error('Failed to delete selfie from GCS', err);
    });
    
    logger.info(`Selfie deleted`, {
      userId: userId.toString(),
      selfieId: selfieId.toString(),
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to delete selfie', error);
    return { success: false, error: 'Failed to delete selfie' };
  }
}

/**
 * Get user selfies
 */
export async function getUserSelfies(userId: Types.ObjectId) {
  return UserSelfie.findActiveByUser(userId);
}

/**
 * Cleanup orphaned uploads (for cron job)
 */
export async function cleanupOrphanedUploads(): Promise<{
  cleaned: number;
  failed: number;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Find orphaned uploads
  const orphaned = await UserSelfie.find({
    status: 'initiated',
    createdAt: { $lt: oneHourAgo },
  });
  
  let cleaned = 0;
  let failed = 0;
  
  const bucket = getBucket();
  
  for (const selfie of orphaned) {
    try {
      // Delete from GCS
      const file = bucket.file(selfie.gcsPath);
      await file.delete().catch(() => {}); // Ignore if doesn't exist
      
      // Mark as deleted
      await selfie.updateOne({
        status: 'deleted',
        deletedAt: new Date(),
      });
      
      cleaned++;
    } catch (error) {
      logger.error('Failed to cleanup orphaned upload', {
        selfieId: selfie._id,
        error,
      });
      failed++;
    }
  }
  
  logger.info(`Cleanup complete`, { cleaned, failed });
  
  return { cleaned, failed };
}

/**
 * Generate signed read URL for GCS object
 * 
 * @param gcsPath - The path to the file in GCS
 * @param expiresIn - Expiration time in seconds (default 10 minutes)
 * @param bucketName - Optional bucket name (defaults to RAW_GENERATIONS for generated images)
 */
export async function generateSignedReadUrl(
  gcsPath: string,
  expiresIn: number = 10 * 60, // 10 minutes default
  bucketName?: string
): Promise<string> {
  // Auto-detect bucket based on path if not specified
  let selectedBucket = bucketName;
  
  if (!selectedBucket) {
    if (gcsPath.includes('/selfies/')) {
      selectedBucket = BUCKETS.PRIVATE_GALLERY;
    } else if (gcsPath.includes('/generations/') || gcsPath.includes('/transformations/')) {
      selectedBucket = BUCKETS.RAW_GENERATIONS;
    } else {
      // Default to RAW_GENERATIONS for backward compatibility
      selectedBucket = BUCKETS.RAW_GENERATIONS;
    }
  }
  
  const bucket = getBucket(selectedBucket);
  const file = bucket.file(gcsPath);
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn * 1000,
  });
  
  return url;
}

/**
 * Upload selfie via proxy (server-side upload)
 * 
 * Accepts file buffer and uploads directly to GCS, avoiding CORS issues
 */
export async function uploadSelfieProxy(
  userId: Types.ObjectId,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{
  success: boolean;
  selfieId?: string;
  selfie?: any;
  error?: string;
  errorCode?: string;
}> {
  try {
    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        errorCode: 'invalid_mime_type',
      };
    }

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        errorCode: 'file_too_large',
      };
    }

    // Validate and process image
    const validation = await validateImage(fileBuffer, {
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      stripExif: true, // Strip EXIF data for privacy
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid image',
        errorCode: 'invalid_image',
      };
    }

    const { width, height } = validation;
    if (!width || !height) {
      return {
        success: false,
        error: 'Could not determine image dimensions',
        errorCode: 'invalid_dimensions',
      };
    }

    // Generate selfie ID
    const selfieId = new Types.ObjectId();

    // Generate GCS path
    const gcsPath = generateSelfiePath(userId, selfieId, mimeType);

    // Upload to GCS - use PRIVATE_GALLERY bucket for user reference images
    // These are private user uploads used as reference for transformations
    const { BUCKETS } = await import('../config/buckets');
    const bucketName = BUCKETS.PRIVATE_GALLERY;
    
    const uploadResult = await uploadBuffer(
      bucketName,
      gcsPath,
      validation.cleanedBuffer || fileBuffer,
      {
        contentType: mimeType,
        metadata: {
          userId: userId.toString(),
          selfieId: selfieId.toString(),
          uploadedAt: new Date().toISOString(),
        },
        cacheControl: 'private, max-age=31536000', // 1 year, private
      }
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Failed to upload to storage',
        errorCode: 'upload_failed',
      };
    }

    // Create selfie record (active state since we've validated everything)
    const selfie = await UserSelfie.create({
      _id: selfieId,
      userId,
      gcsPath,
      mimeType,
      status: 'active',
      sizeBytes: fileBuffer.length,
      width,
      height,
    });

    logger.info('Selfie uploaded via proxy', {
      userId: userId.toString(),
      selfieId: selfieId.toString(),
      width,
      height,
      sizeBytes: fileBuffer.length,
    });

    return {
      success: true,
      selfieId: selfieId.toString(),
      selfie: selfie.toObject(),
    };
  } catch (error: any) {
    logger.error('Failed to upload selfie via proxy', error);
    return {
      success: false,
      error: error.message || 'Failed to upload selfie',
      errorCode: 'upload_failed',
    };
  }
}

