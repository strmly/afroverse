import sharp from 'sharp';
import { logger } from './logger';
import { getBucket } from '../config/storage';
import { BUCKETS } from '../config/buckets';
import {
  applyWatermarks,
  createWatermarkMetadata,
  type WatermarkOptions,
} from '../services/watermark.service';

/**
 * Image Processing Utilities
 * 
 * Handles thumbnail generation and image manipulation.
 */

const THUMBNAIL_WIDTH = 512;
const THUMBNAIL_QUALITY = 85;

/**
 * Generate thumbnail from image buffer
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  options: {
    width?: number;
    quality?: number;
  } = {}
): Promise<Buffer> {
  const width = options.width || THUMBNAIL_WIDTH;
  const quality = options.quality || THUMBNAIL_QUALITY;
  
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality })
      .toBuffer();
    
    logger.debug('Thumbnail generated', {
      originalSize: imageBuffer.length,
      thumbnailSize: thumbnail.length,
      width,
    });
    
    return thumbnail;
  } catch (error) {
    logger.error('Failed to generate thumbnail', error);
    throw error;
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  imageBuffer: Buffer
): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    logger.error('Failed to get image dimensions', error);
    throw error;
  }
}

/**
 * Convert image to specific format
 */
export async function convertImage(
  imageBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp',
  quality: number = 90
): Promise<Buffer> {
  try {
    let pipeline = sharp(imageBuffer);
    
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }
    
    return await pipeline.toBuffer();
  } catch (error) {
    logger.error('Failed to convert image', error);
    throw error;
  }
}

/**
 * Image Validation Result
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  format?: string;
  cleanedBuffer?: Buffer;
}

/**
 * Validate image buffer
 * 
 * Performs comprehensive validation:
 * - Format detection
 * - Dimension checks
 * - EXIF stripping
 * - Size validation
 */
export async function validateImage(
  imageBuffer: Buffer,
  options: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    stripExif?: boolean;
  } = {}
): Promise<ImageValidationResult> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    // Check if valid image
    if (!metadata.width || !metadata.height || !metadata.format) {
      return {
        valid: false,
        error: 'Invalid image format',
      };
    }
    
    // Check minimum dimensions
    if (options.minWidth && metadata.width < options.minWidth) {
      return {
        valid: false,
        error: `Image width too small. Minimum: ${options.minWidth}px`,
      };
    }
    
    if (options.minHeight && metadata.height < options.minHeight) {
      return {
        valid: false,
        error: `Image height too small. Minimum: ${options.minHeight}px`,
      };
    }
    
    // Check maximum dimensions
    if (options.maxWidth && metadata.width > options.maxWidth) {
      return {
        valid: false,
        error: `Image width too large. Maximum: ${options.maxWidth}px`,
      };
    }
    
    if (options.maxHeight && metadata.height > options.maxHeight) {
      return {
        valid: false,
        error: `Image height too large. Maximum: ${options.maxHeight}px`,
      };
    }
    
    // Strip EXIF data if requested (default: true)
    let cleanedBuffer: Buffer | undefined;
    
    if (options.stripExif !== false) {
      cleanedBuffer = await sharp(imageBuffer)
        .rotate() // Auto-rotate based on EXIF
        .withMetadata({
          exif: {}, // Clear EXIF
        })
        .toBuffer();
      
      logger.debug('EXIF data stripped', {
        originalSize: imageBuffer.length,
        cleanedSize: cleanedBuffer.length,
      });
    }
    
    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      cleanedBuffer,
    };
  } catch (error: any) {
    logger.error('Image validation failed', error);
    return {
      valid: false,
      error: error.message || 'Image validation failed',
    };
  }
}

/**
 * Upload image and thumbnail to GCS with watermarking
 * Uses RAW_GENERATIONS bucket for temporary storage
 */
export async function uploadImageToGCS(
  imageBuffer: Buffer,
  imagePath: string,
  thumbPath: string,
  options: {
    transformationId?: string;
    applyWatermark?: boolean;
    visibilityType?: 'public' | 'private' | 'seed';
  } = {}
): Promise<{ watermarkedPath?: string; cleanPath?: string }> {
  try {
    // Use RAW_GENERATIONS bucket for AI-generated images (temporary storage with 24h TTL)
    const bucket = getBucket(BUCKETS.RAW_GENERATIONS);
    
    const applyWatermark = options.applyWatermark !== false; // Default true
    const transformationId = options.transformationId || 'unknown';
    const visibilityType = options.visibilityType || 'public';
    
    let watermarkedBuffer = imageBuffer;
    let cleanBuffer = imageBuffer;
    
    // Apply watermarks if requested
    if (applyWatermark && transformationId) {
      const watermarkMetadata = createWatermarkMetadata(transformationId, visibilityType);
      
      const watermarked = await applyWatermarks(imageBuffer, {
        applyVisibleWatermark: visibilityType === 'public' || visibilityType === 'seed',
        applyInvisibleWatermark: true,
        metadata: watermarkMetadata,
      });
      
      watermarkedBuffer = watermarked.watermarked;
      cleanBuffer = watermarked.clean;
    }
    
    // Generate thumbnails
    const watermarkedThumbnail = await generateThumbnail(watermarkedBuffer);
    const cleanThumbnail = await generateThumbnail(cleanBuffer);
    
    // Upload watermarked version (default for feed/sharing)
    const watermarkedImagePath = imagePath.replace(/(\.[^.]+)$/, '_wm$1');
    const watermarkedThumbPath = thumbPath.replace(/(\.[^.]+)$/, '_wm$1');
    
    const watermarkedImageFile = bucket.file(watermarkedImagePath);
    await watermarkedImageFile.save(watermarkedBuffer, {
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    const watermarkedThumbFile = bucket.file(watermarkedThumbPath);
    await watermarkedThumbFile.save(watermarkedThumbnail, {
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    // Upload clean version (for Pro users / private downloads)
    const cleanImagePath = imagePath.replace(/(\.[^.]+)$/, '_clean$1');
    const cleanThumbPath = thumbPath.replace(/(\.[^.]+)$/, '_clean$1');
    
    const cleanImageFile = bucket.file(cleanImagePath);
    await cleanImageFile.save(cleanBuffer, {
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    const cleanThumbFile = bucket.file(cleanThumbPath);
    await cleanThumbFile.save(cleanThumbnail, {
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    logger.info('Images uploaded to GCS with watermarks', {
      watermarkedImagePath,
      cleanImagePath,
      watermarkedThumbPath,
      cleanThumbPath,
      transformationId,
    });
    
    return {
      watermarkedPath: watermarkedImagePath,
      cleanPath: cleanImagePath,
    };
  } catch (error) {
    logger.error('Failed to upload images to GCS', error);
    throw error;
  }
}

