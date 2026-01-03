/**
 * Nano Banana Pro Image Generator for Seed Library
 * Generates actual AI images with hyper-realistic photography style
 */

import axios from 'axios';
import sharp from 'sharp';
import { Types } from 'mongoose';
import { uploadImageToGCS } from '../../src/utils/image';
import { applyWatermarks } from '../../src/services/watermark.service';
import { logger } from '../../src/utils/logger';

export interface NanoBananaRequest {
  prompt: string;
  negativePrompt: string;
  aspectRatio: '1:1';
  seed?: number;
}

export interface NanoBananaResponse {
  imageUrl: string;
  generationId: string;
  seed: number;
}

export interface GeneratedImage {
  watermarkedPath: string;
  watermarkedThumbPath: string;
  cleanPath?: string;
  dimensions: { width: number; height: number };
}

// Base photography style (ALWAYS INCLUDED)
const BASE_PHOTOGRAPHY_STYLE = `
Hyper-realistic amateur photography, iPhone snapshot quality, natural lighting, casual everyday aesthetic, realistic details, background also in focus, tiny imperfections only from real life (not digital noise), no filters, no dramatic color grading, soft neutral tones, imperfect framing with subjects slightly off-center, real-life unedited vibe, clean high-resolution look, crisp edges, natural skin texture, realistic shadows and highlights, handheld composition, 23mm wide-angle feel, 1:1 aspect ratio
`.trim();

const BASE_NEGATIVE_PROMPT = `
No date/time stamp, no cinematic look, no vignette, no background blur, no symmetrical composition, no grain, no low resolution, no harsh artifacts
`.trim();

export class NanoBananaGenerator {
  private apiUrl: string;
  private apiKey: string;
  
  constructor() {
    this.apiUrl = process.env.NANO_BANANA_API_URL || 'https://api.nanobanana.com/v1/generate';
    this.apiKey = process.env.NANO_BANANA_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('NANO_BANANA_API_KEY not configured');
    }
  }
  
  /**
   * Generate image with Nano Banana Pro
   */
  async generateImage(request: NanoBananaRequest): Promise<NanoBananaResponse> {
    try {
      // Combine custom prompt with base photography style
      const fullPrompt = [
        request.prompt,
        BASE_PHOTOGRAPHY_STYLE,
      ].join(', ');
      
      // Combine negative prompts
      const fullNegativePrompt = [
        request.negativePrompt,
        BASE_NEGATIVE_PROMPT,
      ].join(', ');
      
      logger.info('Calling Nano Banana Pro API', {
        promptLength: fullPrompt.length,
        aspectRatio: request.aspectRatio,
      });
      
      const response = await axios.post(
        this.apiUrl,
        {
          prompt: fullPrompt,
          negative_prompt: fullNegativePrompt,
          aspect_ratio: '1:1',
          seed: request.seed,
          model: 'nano-banana-pro',
          quality: 'high',
          output_format: 'webp',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 minutes
        }
      );
      
      if (!response.data.image_url) {
        throw new Error('No image URL in response');
      }
      
      return {
        imageUrl: response.data.image_url,
        generationId: response.data.generation_id || new Types.ObjectId().toString(),
        seed: response.data.seed || request.seed || Math.floor(Math.random() * 1000000),
      };
    } catch (error: any) {
      logger.error('Nano Banana Pro generation failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }
  
  /**
   * Download image from URL
   */
  async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000, // 1 minute
      });
      
      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('Failed to download image', {
        url,
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Process and upload generated image
   */
  async processAndUpload(
    imageBuffer: Buffer,
    userId: string,
    generationId: string,
    versionId: string,
    seedId: string
  ): Promise<GeneratedImage> {
    try {
      // 1. Apply watermarks
      const { watermarkedBuffer, cleanBuffer } = await applyWatermarks(
        imageBuffer,
        {
          userId: new Types.ObjectId(userId),
          generationId: new Types.ObjectId(generationId),
          timestamp: new Date(),
          seedId,
        },
        {
          applyVisible: true,
          isProUser: false,
        }
      );
      
      // 2. Get dimensions
      const metadata = await sharp(watermarkedBuffer).metadata();
      const dimensions = {
        width: metadata.width || 1024,
        height: metadata.height || 1024,
      };
      
      // 3. Generate thumbnail
      const thumbnailBuffer = await sharp(watermarkedBuffer)
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toBuffer();
      
      // 4. Upload to GCS
      const basePath = `generations/${userId}/${generationId}`;
      const timestamp = Date.now();
      
      const watermarkedPath = `${basePath}/v1_${timestamp}_wm.webp`;
      const watermarkedThumbPath = `${basePath}/v1_${timestamp}_thumb_wm.webp`;
      
      await uploadImageToGCS(watermarkedBuffer, watermarkedPath, 'image/webp');
      await uploadImageToGCS(thumbnailBuffer, watermarkedThumbPath, 'image/webp');
      
      // 5. Optionally upload clean version
      let cleanPath: string | undefined;
      if (cleanBuffer) {
        cleanPath = `${basePath}/v1_${timestamp}_clean.webp`;
        await uploadImageToGCS(cleanBuffer, cleanPath, 'image/webp');
      }
      
      logger.info('Image processed and uploaded', {
        watermarkedPath,
        dimensions,
      });
      
      return {
        watermarkedPath,
        watermarkedThumbPath,
        cleanPath,
        dimensions,
      };
    } catch (error: any) {
      logger.error('Failed to process and upload image', {
        error: error.message,
      });
      throw error;
    }
  }
  
  /**
   * Generate, process, and upload in one call
   */
  async generateComplete(
    request: NanoBananaRequest,
    userId: string,
    generationId: string,
    versionId: string,
    seedId: string
  ): Promise<GeneratedImage> {
    // Step 1: Generate image
    const generated = await this.generateImage(request);
    
    // Step 2: Download image
    const imageBuffer = await this.downloadImage(generated.imageUrl);
    
    // Step 3: Process and upload
    return await this.processAndUpload(
      imageBuffer,
      userId,
      generationId,
      versionId,
      seedId
    );
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function generateWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: error.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Generation failed after retries');
}

