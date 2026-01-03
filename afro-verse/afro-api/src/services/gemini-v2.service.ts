import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Gemini Service V2
 * 
 * Direct API integration with Google Gemini for text and image generation.
 * Uses v1beta API to access all models including image generation.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Models available with billing enabled
const MODEL_TEXT_FAST = 'gemini-2.5-flash';
const MODEL_TEXT_PRO = 'gemini-2.5-pro';
const MODEL_IMAGE_GEN = 'gemini-2.0-flash-exp-image-generation';
const MODEL_NANO_BANANA_PRO = 'nano-banana-pro-preview';

export interface GenerationInput {
  prompt: string;
  systemInstruction?: string;
  images?: Buffer[];
  aspectRatio?: '1:1' | '9:16';
  quality?: 'standard' | 'high';
}

export interface GenerationOutput {
  imageData: Buffer;
  mimeType: string;
  requestId?: string;
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!env.GEMINI_API_KEY;
}

/**
 * Generate text with Gemini
 */
export async function generateText(prompt: string, useProModel = false): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('Gemini API not configured');
  }

  const model = useProModel ? MODEL_TEXT_PRO : MODEL_TEXT_FAST;
  const url = `${API_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Text generation failed');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No text generated');
    }

    logger.info('Generated text with Gemini', { model, length: text.length });
    return text;

  } catch (error: any) {
    logger.error('Gemini text generation failed', error);
    throw error;
  }
}

/**
 * Generate image with Gemini (Note: Currently returns base64, conversion needed)
 */
export async function generateImage(input: GenerationInput): Promise<GenerationOutput> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('Gemini API not configured');
  }

  // For now, use text generation as image generation models need special handling
  // TODO: Implement proper image generation when API supports it
  logger.warn('Image generation via Gemini is experimental');
  
  const model = input.quality === 'high' ? MODEL_NANO_BANANA_PRO : MODEL_TEXT_FAST;
  const url = `${API_BASE}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const prompt = `Generate a detailed description for: ${input.prompt}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Generation failed');
    }

    // For now, return a placeholder
    // In production, you'd call an actual image generation service
    throw new Error('Image generation not yet fully implemented. Use Replicate or FAL.ai instead.');

  } catch (error: any) {
    logger.error('Gemini image generation failed', error);
    throw error;
  }
}

/**
 * Export the original interface for compatibility
 */
export { GenerationInput as GeminiGenerationInput };
export { GenerationOutput as GeminiGenerationOutput };



