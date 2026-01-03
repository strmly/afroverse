import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Gemini Service
 * 
 * Integration with Google Gemini API for image generation.
 * Supports Nano Banana (Gemini 2.5 Flash) and Nano Banana Pro (Gemini 3 Pro).
 */

// Initialize Gemini AI with v1beta API (required for image generation models)
const genAI = env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(env.GEMINI_API_KEY)
  : null;

// Image generation models from Gemini API (Nano Banana)
// Nano Banana: Gemini 2.5 Flash Image (speed and efficiency)
const MODEL_NANO_BANANA = 'gemini-2.5-flash-image';
// Nano Banana Pro: Gemini 3 Pro Image Preview (professional assets with advanced reasoning)
const MODEL_NANO_BANANA_PRO = 'gemini-3-pro-image-preview';

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

export interface RefineInput extends GenerationInput {
  baseImage: Buffer;
  instruction: string;
}

/**
 * Build system instruction for image generation
 */
function buildSystemInstruction(): string {
  return `You are an AI that generates high-quality portrait images with the following requirements:

IDENTITY PRESERVATION:
- Preserve the user's face identity and features - they must be clearly recognizable
- Maintain accurate skin tone, facial structure, and distinctive features
- Keep realistic human proportions

CULTURAL RESPECT:
- Create respectful and authentic cultural representations
- Avoid stereotypes, caricatures, or exaggerated features
- Celebrate diversity with dignity

SAFETY:
- No nudity or sexually explicit content
- No hate speech, violence, or harmful content
- No content involving minors in inappropriate contexts
- No content promoting illegal activities

OUTPUT QUALITY:
- High-quality portrait with professional lighting
- Centered single subject with clear focus
- Consistent style throughout the image
- Sharp details and good composition

The image should be suitable for use as a profile picture or social media avatar.`;
}

/**
 * Build user prompt from style parameters
 */
export function buildUserPrompt(params: {
  presetId?: string;
  userPrompt?: string;
  aspectRatio: '1:1' | '9:16';
}): string {
  let prompt = '';
  
  // Add preset description
  if (params.presetId) {
    const presetDescriptions: Record<string, string> = {
      'afrofuturism': 'Afrofuturist aesthetic with vibrant colors, geometric patterns, and futuristic elements. Blend of African cultural motifs with sci-fi technology.',
      'royal': 'Royal African aesthetic with traditional royal attire, crowns, jewelry, and regal posture. Rich fabrics like kente or mudcloth.',
      'street': 'Contemporary street style with modern urban fashion, bold colors, and confident attitude.',
      'vintage': 'Vintage portrait style with classic photography aesthetics, warm tones, and timeless elegance.',
      'warrior': 'Warrior aesthetic with traditional warrior attire, accessories, and powerful stance.',
    };
    
    const presetDesc = presetDescriptions[params.presetId] || '';
    if (presetDesc) {
      prompt += presetDesc + ' ';
    }
  }
  
  // Add user prompt
  if (params.userPrompt) {
    prompt += params.userPrompt + ' ';
  }
  
  // Add technical constraints
  prompt += `\n\nTechnical requirements:
- Aspect ratio: ${params.aspectRatio}
- Single centered subject
- Professional portrait composition
- High quality and sharp details`;
  
  return prompt.trim();
}

/**
 * Generate image with Gemini
 */
export async function generateImage(input: GenerationInput): Promise<GenerationOutput> {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }
  
  try {
    // Always use Nano Banana Pro for best quality and advanced reasoning
    const modelName = MODEL_NANO_BANANA_PRO;
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(input.systemInstruction || buildSystemInstruction() ? { systemInstruction: input.systemInstruction || buildSystemInstruction() } : {}),
    } as any);
    
    logger.info('Using Nano Banana Pro for generation', { model: modelName });
    
    // Prepare parts for generation
    const parts: any[] = [{ text: input.prompt }];
    
    // Add input images (selfies)
    if (input.images && input.images.length > 0) {
      for (const imageBuffer of input.images) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBuffer.toString('base64'),
          },
        });
      }
    }
    
    // Generate content
    const result = await model.generateContent(parts);
    const response = result.response;
    
    // Check if blocked
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
    }
    
    // Extract image data
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error('No generation candidate returned');
    }
    
    const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      throw new Error('No image data in response');
    }
    
    const imageData = Buffer.from(imagePart.inlineData.data, 'base64');
    const mimeType = imagePart.inlineData.mimeType;
    
    logger.info('Image generated successfully with Nano Banana Pro', {
      model: MODEL_NANO_BANANA_PRO,
      size: imageData.length,
    });
    
    return {
      imageData,
      mimeType,
      requestId: (response as any).usageMetadata?.toString() || undefined,
    };
  } catch (error: any) {
    logger.error('Gemini generation failed', {
      error: error.message,
      code: error.code,
    });
    
    // Classify error
    if (error.message?.includes('blocked')) {
      throw new Error('BLOCKED');
    } else if (error.code === 'RESOURCE_EXHAUSTED') {
      throw new Error('RATE_LIMITED');
    } else {
      throw error;
    }
  }
}

/**
 * Refine existing image with instruction
 */
export async function refineImage(input: RefineInput): Promise<GenerationOutput> {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }
  
  try {
    // Always use Nano Banana Pro for refinements
    const model = genAI.getGenerativeModel({
      model: MODEL_NANO_BANANA_PRO,
      systemInstruction: buildSystemInstruction(),
    } as any);
    
    // Build refinement prompt
    const refinementPrompt = `Based on the provided image, apply the following change while keeping the same person, style, and composition:

${input.instruction}

Important: Only apply the requested change. Keep everything else exactly the same.`;
    
    // Prepare parts
    const parts: any[] = [
      { text: refinementPrompt },
      {
        inlineData: {
          mimeType: 'image/png',
          data: input.baseImage.toString('base64'),
        },
      },
    ];
    
    // Add reference images if provided
    if (input.images && input.images.length > 0) {
      for (const imageBuffer of input.images) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBuffer.toString('base64'),
          },
        });
      }
    }
    
    // Generate refined content
    const result = await model.generateContent(parts);
    const response = result.response;
    
    // Check if blocked
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
    }
    
    // Extract image data
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error('No generation candidate returned');
    }
    
    const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      throw new Error('No image data in response');
    }
    
    const imageData = Buffer.from(imagePart.inlineData.data, 'base64');
    const mimeType = imagePart.inlineData.mimeType;
    
    logger.info('Image refined successfully', {
      model: input.quality === 'high' ? MODEL_NANO_BANANA_PRO : MODEL_NANO_BANANA,
      size: imageData.length,
    });
    
    return {
      imageData,
      mimeType,
      requestId: (response as any).usageMetadata?.toString() || undefined,
    };
  } catch (error: any) {
    logger.error('Gemini refinement failed', {
      error: error.message,
      code: error.code,
    });
    
    // Classify error
    if (error.message?.includes('blocked')) {
      throw new Error('BLOCKED');
    } else if (error.code === 'RESOURCE_EXHAUSTED') {
      throw new Error('RATE_LIMITED');
    } else {
      throw error;
    }
  }
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!env.GEMINI_API_KEY;
}

