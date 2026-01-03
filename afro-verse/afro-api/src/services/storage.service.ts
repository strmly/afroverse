/**
 * Storage Service
 * 
 * Low-level GCS operations for bucket management.
 * This service provides primitives for the transformation service.
 */

import { Storage, Bucket, File } from '@google-cloud/storage';
import { getStorage } from '../config/storage';
import { BUCKETS, BUCKET_CONFIGS, LIFECYCLE, URLS, getBucketConfig } from '../config/buckets';
import { logger } from '../utils/logger';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface SignedUrlResult {
  success: boolean;
  url?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Get bucket instance
 */
export function getBucketInstance(bucketName: string): Bucket {
  const storage = getStorage();
  return storage.bucket(bucketName);
}

/**
 * Upload buffer to bucket
 */
export async function uploadBuffer(
  bucket: string,
  path: string,
  buffer: Buffer,
  options: {
    contentType: string;
    metadata?: Record<string, any>;
    cacheControl?: string;
  }
): Promise<UploadResult> {
  try {
    const bucketInstance = getBucketInstance(bucket);
    const file = bucketInstance.file(path);
    
    await file.save(buffer, {
      contentType: options.contentType,
      metadata: {
        ...options.metadata,
      },
      resumable: false,
    });
    
    // Set cache control
    if (options.cacheControl) {
      await file.setMetadata({
        cacheControl: options.cacheControl,
      });
    }
    
    // Make public if configured
    const config = getBucketConfig(bucket);
    if (config.public) {
      await file.makePublic();
    }
    
    const url = URLS.public(bucket, path);
    
    logger.info('Uploaded to GCS', {
      bucket,
      path,
      size: buffer.length,
      public: config.public,
    });
    
    return {
      success: true,
      path,
      url,
    };
  } catch (error: any) {
    logger.error('Failed to upload to GCS', {
      bucket,
      path,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Download file from bucket
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  try {
    const bucketInstance = getBucketInstance(bucket);
    const file = bucketInstance.file(path);
    
    const [buffer] = await file.download();
    
    logger.info('Downloaded from GCS', {
      bucket,
      path,
      size: buffer.length,
    });
    
    return {
      success: true,
      buffer,
    };
  } catch (error: any) {
    logger.error('Failed to download from GCS', {
      bucket,
      path,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete file from bucket
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bucketInstance = getBucketInstance(bucket);
    const file = bucketInstance.file(path);
    
    await file.delete();
    
    logger.info('Deleted from GCS', {
      bucket,
      path,
    });
    
    return { success: true };
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error.code === 404) {
      logger.info('File already deleted (404)', { bucket, path });
      return { success: true };
    }
    
    logger.error('Failed to delete from GCS', {
      bucket,
      path,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Copy file between buckets
 */
export async function copyFile(
  sourceBucket: string,
  sourcePath: string,
  destBucket: string,
  destPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sourceBucketInstance = getBucketInstance(sourceBucket);
    const sourceFile = sourceBucketInstance.file(sourcePath);
    
    const destBucketInstance = getBucketInstance(destBucket);
    const destFile = destBucketInstance.file(destPath);
    
    await sourceFile.copy(destFile);
    
    logger.info('Copied file in GCS', {
      sourceBucket,
      sourcePath,
      destBucket,
      destPath,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to copy file in GCS', {
      sourceBucket,
      sourcePath,
      destBucket,
      destPath,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Move file between buckets
 */
export async function moveFile(
  sourceBucket: string,
  sourcePath: string,
  destBucket: string,
  destPath: string
): Promise<{ success: boolean; error?: string }> {
  // Copy then delete
  const copyResult = await copyFile(sourceBucket, sourcePath, destBucket, destPath);
  
  if (!copyResult.success) {
    return copyResult;
  }
  
  const deleteResult = await deleteFile(sourceBucket, sourcePath);
  
  if (!deleteResult.success) {
    logger.warn('File copied but original not deleted', {
      sourceBucket,
      sourcePath,
    });
  }
  
  return { success: true };
}

/**
 * Generate signed URL for private access
 */
export async function generateSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = LIFECYCLE.SIGNED_URL_EXPIRY
): Promise<SignedUrlResult> {
  try {
    const bucketInstance = getBucketInstance(bucket);
    const file = bucketInstance.file(path);
    
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt,
    });
    
    logger.info('Generated signed URL', {
      bucket,
      path,
      expiresIn,
    });
    
    return {
      success: true,
      url,
      expiresAt,
    };
  } catch (error: any) {
    logger.error('Failed to generate signed URL', {
      bucket,
      path,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if file exists
 */
export async function fileExists(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const bucketInstance = getBucketInstance(bucket);
    const file = bucketInstance.file(path);
    
    const [exists] = await file.exists();
    return exists;
  } catch (error: any) {
    logger.error('Failed to check file existence', {
      bucket,
      path,
      error: error.message,
    });
    return false;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  bucket: string,
  path: string
): Promise<{ success: boolean; metadata?: any; error?: string }> {
  try {
    const bucketInstance = getBucketInstance(bucket);
    const file = bucketInstance.file(path);
    
    const [metadata] = await file.getMetadata();
    
    return {
      success: true,
      metadata,
    };
  } catch (error: any) {
    logger.error('Failed to get file metadata', {
      bucket,
      path,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Invalidate CDN cache for file
 */
export async function invalidateCDNCache(
  paths: string[]
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement CDN invalidation
  // This would call Cloud CDN's cache invalidation API
  logger.info('CDN invalidation requested', { paths });
  
  return { success: true };
}

/**
 * Bulk delete files
 */
export async function bulkDeleteFiles(
  bucket: string,
  paths: string[]
): Promise<{
  success: boolean;
  deleted: number;
  failed: number;
  errors: string[];
}> {
  let deleted = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const path of paths) {
    const result = await deleteFile(bucket, path);
    
    if (result.success) {
      deleted++;
    } else {
      failed++;
      errors.push(`${path}: ${result.error}`);
    }
  }
  
  logger.info('Bulk delete completed', {
    bucket,
    total: paths.length,
    deleted,
    failed,
  });
  
  return {
    success: failed === 0,
    deleted,
    failed,
    errors,
  };
}

/**
 * Setup bucket lifecycle rules (admin operation)
 */
export async function setupBucketLifecycle(
  bucket: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getBucketConfig(bucket);
    
    if (!config.ttl) {
      logger.info('No TTL configured for bucket', { bucket });
      return { success: true };
    }
    
    const bucketInstance = getBucketInstance(bucket);
    
    await bucketInstance.addLifecycleRule({
      action: {
        type: 'Delete',
      },
      condition: {
        age: Math.floor(config.ttl / (24 * 60 * 60)), // Convert seconds to days
      },
    });
    
    logger.info('Lifecycle rule added to bucket', {
      bucket,
      ttlDays: Math.floor(config.ttl / (24 * 60 * 60)),
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to setup bucket lifecycle', {
      bucket,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify all buckets exist
 */
export async function verifyBuckets(): Promise<{
  success: boolean;
  existing: string[];
  missing: string[];
}> {
  const existing: string[] = [];
  const missing: string[] = [];
  
  for (const bucket of Object.values(BUCKETS)) {
    try {
      const bucketInstance = getBucketInstance(bucket);
      const [exists] = await bucketInstance.exists();
      
      if (exists) {
        existing.push(bucket);
      } else {
        missing.push(bucket);
      }
    } catch (error: any) {
      logger.error('Failed to check bucket', { bucket, error: error.message });
      missing.push(bucket);
    }
  }
  
  logger.info('Bucket verification complete', {
    existing: existing.length,
    missing: missing.length,
  });
  
  return {
    success: missing.length === 0,
    existing,
    missing,
  };
}



