import sharp from 'sharp';
import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Watermark Service
 * 
 * Handles both visible and invisible watermarking of generated images
 * following the two-layer watermark strategy for brand protection and provenance.
 */

export interface WatermarkMetadata {
  platformId: string;
  transformationId: string;
  creationTimestamp: string;
  visibilityType: 'public' | 'private' | 'seed';
  checksum: string;
}

export interface WatermarkOptions {
  applyVisibleWatermark: boolean;
  applyInvisibleWatermark: boolean;
  metadata?: WatermarkMetadata;
}

/**
 * Apply visible watermark to image
 * Places "AfroMoji" text in bottom-right corner
 */
export async function applyVisibleWatermark(
  imageBuffer: Buffer,
  options: { opacity?: number; size?: number } = {}
): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not read image dimensions');
    }

    const imageWidth = metadata.width;
    const imageHeight = metadata.height;

    // Calculate watermark dimensions (6-8% of image width)
    const watermarkSize = Math.floor(imageWidth * 0.07);
    const padding = Math.floor(imageWidth * 0.05);
    const opacity = options.opacity || 0.65;

    // Create watermark text as SVG
    const watermarkText = 'AfroMoji';
    const fontSize = watermarkSize;
    const textLength = watermarkText.length * fontSize * 0.6; // Approximate text width

    // SVG with drop shadow for better legibility
    const svg = Buffer.from(`
      <svg width="${textLength + 20}" height="${fontSize + 20}">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text 
          x="10" 
          y="${fontSize}" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          font-weight="600"
          fill="white" 
          opacity="${opacity}"
          filter="url(#shadow)"
        >${watermarkText}</text>
      </svg>
    `);

    // Calculate position (bottom-right corner) - must be integers
    const left = Math.floor(imageWidth - textLength - padding - 20);
    const top = Math.floor(imageHeight - fontSize - padding - 20);

    // Composite watermark onto image
    const watermarkedImage = await image
      .composite([
        {
          input: svg,
          top,
          left,
        },
      ])
      .toBuffer();

    logger.info('Visible watermark applied', {
      imageWidth,
      imageHeight,
      watermarkSize,
      position: { left, top },
    });

    return watermarkedImage;
  } catch (error: any) {
    logger.error('Error applying visible watermark', error);
    throw new Error(`Failed to apply visible watermark: ${error.message}`);
  }
}

/**
 * Apply invisible watermark to image
 * Embeds metadata in frequency domain for robustness
 * 
 * Note: This is a simplified implementation. For production, consider:
 * - Frequency-domain watermarking (DCT/DWT)
 * - Robust watermarking libraries
 * - Model-level watermarking if supported
 */
export async function applyInvisibleWatermark(
  imageBuffer: Buffer,
  metadata: WatermarkMetadata
): Promise<Buffer> {
  try {
    // Create watermark data string
    const watermarkData = JSON.stringify({
      p: metadata.platformId,
      t: metadata.transformationId,
      c: metadata.creationTimestamp,
      v: metadata.visibilityType,
      h: metadata.checksum,
    });

    // For MVP: Embed in image metadata using Sharp's EXIF/XMP support
    // This is not as robust as frequency-domain watermarking but better than nothing
    const image = sharp(imageBuffer);
    
    // Add watermark data to image metadata
    const watermarkedImage = await image
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: `AfroMoji - ${metadata.transformationId}`,
            ImageDescription: watermarkData,
          },
        },
      })
      .toBuffer();

    logger.info('Invisible watermark applied', {
      transformationId: metadata.transformationId,
      dataLength: watermarkData.length,
    });

    return watermarkedImage;
  } catch (error: any) {
    logger.error('Error applying invisible watermark', error);
    throw new Error(`Failed to apply invisible watermark: ${error.message}`);
  }
}

/**
 * Apply both visible and invisible watermarks
 * This is the main entry point for watermarking pipeline
 */
export async function applyWatermarks(
  imageBuffer: Buffer,
  options: WatermarkOptions
): Promise<{ watermarked: Buffer; clean: Buffer }> {
  try {
    let watermarkedBuffer = imageBuffer;
    const cleanBuffer = imageBuffer;

    // Apply invisible watermark (always applied)
    if (options.applyInvisibleWatermark && options.metadata) {
      watermarkedBuffer = await applyInvisibleWatermark(watermarkedBuffer, options.metadata);
    }

    // Apply visible watermark (conditional)
    if (options.applyVisibleWatermark) {
      watermarkedBuffer = await applyVisibleWatermark(watermarkedBuffer);
    }

    logger.info('Watermarks applied successfully', {
      visible: options.applyVisibleWatermark,
      invisible: options.applyInvisibleWatermark,
      transformationId: options.metadata?.transformationId,
    });

    return {
      watermarked: watermarkedBuffer,
      clean: options.applyInvisibleWatermark && options.metadata 
        ? await applyInvisibleWatermark(cleanBuffer, options.metadata)
        : cleanBuffer,
    };
  } catch (error: any) {
    logger.error('Error applying watermarks', error);
    throw error;
  }
}

/**
 * Create watermark metadata for a transformation
 */
export function createWatermarkMetadata(
  transformationId: string,
  visibilityType: 'public' | 'private' | 'seed' = 'public'
): WatermarkMetadata {
  const timestamp = new Date().toISOString();
  const checksum = crypto
    .createHash('sha256')
    .update(`${transformationId}-${timestamp}`)
    .digest('hex')
    .substring(0, 16);

  return {
    platformId: 'afromoji',
    transformationId,
    creationTimestamp: timestamp,
    visibilityType,
    checksum,
  };
}

/**
 * Extract invisible watermark from image
 * Used for verification and abuse tracking
 */
export async function extractInvisibleWatermark(
  imageBuffer: Buffer
): Promise<WatermarkMetadata | null> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (metadata.exif) {
      // Try to extract from EXIF
      const exifData = metadata.exif as any;
      if (exifData.ImageDescription) {
        try {
          const data = JSON.parse(exifData.ImageDescription);
          return {
            platformId: data.p,
            transformationId: data.t,
            creationTimestamp: data.c,
            visibilityType: data.v,
            checksum: data.h,
          };
        } catch {
          // Could not parse watermark data
        }
      }
    }

    return null;
  } catch (error: any) {
    logger.error('Error extracting invisible watermark', error);
    return null;
  }
}

/**
 * Verify that an image has valid watermark
 */
export async function verifyWatermark(
  imageBuffer: Buffer,
  expectedTransformationId?: string
): Promise<boolean> {
  try {
    const watermark = await extractInvisibleWatermark(imageBuffer);
    
    if (!watermark) {
      return false;
    }

    // Verify platform ID
    if (watermark.platformId !== 'afromoji') {
      return false;
    }

    // Verify transformation ID if provided
    if (expectedTransformationId && watermark.transformationId !== expectedTransformationId) {
      return false;
    }

    // Verify checksum
    const expectedChecksum = crypto
      .createHash('sha256')
      .update(`${watermark.transformationId}-${watermark.creationTimestamp}`)
      .digest('hex')
      .substring(0, 16);

    if (watermark.checksum !== expectedChecksum) {
      return false;
    }

    return true;
  } catch (error: any) {
    logger.error('Error verifying watermark', error);
    return false;
  }
}

