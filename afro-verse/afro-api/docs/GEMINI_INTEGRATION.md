# Gemini Nano Banana Pro Integration

This document describes the integration of Google's Gemini Nano Banana Pro image generation models into the AfroMoji API.

## Overview

Nano Banana is the name for Gemini's native image generation capabilities. We support two models:

1. **Nano Banana** (`gemini-2.5-flash-image`)
   - Optimized for speed and efficiency
   - Best for high-volume, low-latency tasks
   - Standard quality output
   - Lower cost per generation

2. **Nano Banana Pro** (`gemini-3-pro-image-preview`)
   - Designed for professional asset production
   - Advanced reasoning ("Thinking") capabilities
   - Follows complex instructions
   - High-fidelity text rendering
   - Higher quality output

## Setup

### 1. Install Dependencies

The required package is already installed:

```bash
npm install @google/generative-ai
```

### 2. Configure API Key

Run the setup script:

```bash
npm run setup:gemini
```

Or manually add to your `.env` file:

```bash
GEMINI_API_KEY=AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE
```

### 3. Test the Integration

Run the test script to verify everything works:

```bash
npm run test:gemini
```

This will generate three test images:
- `test-output-nano-banana.png` - Basic generation with standard model
- `test-output-nano-banana-pro.png` - Pro generation with high quality
- `test-output-custom-instruction.png` - Generation with custom system instruction

## Usage

### Basic Image Generation

```typescript
import { generateImage } from './services/gemini.service';

const result = await generateImage({
  prompt: 'Create a picture of a futuristic banana with neon lights in a cyberpunk city.',
  quality: 'standard', // or 'high' for Nano Banana Pro
  aspectRatio: '1:1', // or '9:16'
});

// result.imageData is a Buffer containing the PNG image
// result.mimeType is the MIME type (e.g., 'image/png')
```

### With Reference Images (Face Identity Preservation)

```typescript
import { generateImage } from './services/gemini.service';
import * as fs from 'fs';

const selfieBuffer = fs.readFileSync('path/to/selfie.jpg');

const result = await generateImage({
  prompt: 'Afrofuturist portrait with vibrant colors and geometric patterns',
  quality: 'high', // Use Pro for better face preservation
  aspectRatio: '1:1',
  images: [selfieBuffer], // Reference image(s)
});
```

### With Custom System Instruction

```typescript
const result = await generateImage({
  prompt: 'A golden crown with African patterns',
  quality: 'high',
  aspectRatio: '1:1',
  systemInstruction: 'You are an expert at creating culturally authentic African art. Focus on traditional patterns, colors, and symbolism.',
});
```

### Image Refinement

```typescript
import { refineImage } from './services/gemini.service';

const baseImageBuffer = fs.readFileSync('path/to/base-image.png');

const result = await refineImage({
  baseImage: baseImageBuffer,
  instruction: 'Add a golden crown to the person in the image',
  quality: 'high',
  aspectRatio: '1:1',
});
```

## API Reference

### `generateImage(input: GenerationInput): Promise<GenerationOutput>`

Generate a new image from a text prompt.

**Parameters:**

```typescript
interface GenerationInput {
  prompt: string;              // Text description of the image to generate
  systemInstruction?: string;  // Optional system instruction for the model
  images?: Buffer[];           // Optional reference images (e.g., selfies)
  aspectRatio?: '1:1' | '9:16'; // Image aspect ratio (default: '1:1')
  quality?: 'standard' | 'high'; // Generation quality (default: 'standard')
}
```

**Returns:**

```typescript
interface GenerationOutput {
  imageData: Buffer;    // PNG image data
  mimeType: string;     // MIME type (e.g., 'image/png')
  requestId?: string;   // Optional request ID for tracking
}
```

### `refineImage(input: RefineInput): Promise<GenerationOutput>`

Refine an existing image with an instruction.

**Parameters:**

```typescript
interface RefineInput extends GenerationInput {
  baseImage: Buffer;    // Base image to refine
  instruction: string;  // Instruction for refinement
}
```

### `isGeminiConfigured(): boolean`

Check if the Gemini API key is configured.

### `buildUserPrompt(params): string`

Build a user prompt from style parameters. Used internally by the generation pipeline.

## Model Selection

The service automatically selects the appropriate model based on the `quality` parameter:

- `quality: 'standard'` → Uses `gemini-2.5-flash-image` (Nano Banana)
- `quality: 'high'` → Uses `gemini-3-pro-image-preview` (Nano Banana Pro)

## Safety and Content Moderation

The service includes built-in safety features:

1. **System Instructions**: Default system instruction enforces:
   - Identity preservation for face images
   - Cultural respect and authenticity
   - No inappropriate content
   - High-quality output standards

2. **Content Blocking**: The API automatically blocks:
   - Nudity or sexually explicit content
   - Hate speech or violence
   - Harmful content
   - Content involving minors inappropriately

3. **Error Handling**: Blocked content throws an error with reason:
   ```typescript
   try {
     await generateImage({ prompt: 'inappropriate content' });
   } catch (error) {
     if (error.message === 'BLOCKED') {
       // Handle blocked content
     }
   }
   ```

## Error Handling

The service throws errors for various failure scenarios:

```typescript
try {
  const result = await generateImage({ prompt: 'test' });
} catch (error) {
  if (error.message === 'BLOCKED') {
    // Content was blocked by safety filters
  } else if (error.message === 'RATE_LIMITED') {
    // Rate limit exceeded
  } else if (error.message === 'Gemini API not configured') {
    // API key not set
  } else {
    // Other error
  }
}
```

## Integration with Generation Pipeline

The Gemini service is integrated into the main generation pipeline at `src/ai/generationPipeline.ts`. It's used as a fallback or primary provider depending on configuration.

To use Gemini as the primary provider, update the generation pipeline configuration.

## Best Practices

1. **Use Pro for Complex Tasks**: Use `quality: 'high'` (Nano Banana Pro) for:
   - Face identity preservation
   - Complex cultural representations
   - Professional-quality assets
   - Text rendering in images

2. **Use Standard for Speed**: Use `quality: 'standard'` (Nano Banana) for:
   - High-volume generation
   - Simple prompts
   - Quick previews
   - Cost-sensitive applications

3. **Provide Reference Images**: When generating portraits, always provide reference selfie images for better identity preservation.

4. **Use System Instructions**: Customize system instructions for specific use cases to get better results.

5. **Handle Errors Gracefully**: Always implement proper error handling, especially for content blocking.

## Cost Optimization

- Use `quality: 'standard'` when possible to reduce costs
- Cache generated images to avoid regenerating the same content
- Implement rate limiting to prevent excessive API usage
- Monitor usage through Google Cloud Console

## Troubleshooting

### "Gemini API not configured"

Make sure `GEMINI_API_KEY` is set in your `.env` file:

```bash
GEMINI_API_KEY=AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE
```

### "Content blocked"

The prompt or generated content violated safety policies. Review the content and adjust your prompt to comply with safety guidelines.

### "Rate limited"

You've exceeded the API rate limit. Implement exponential backoff or wait before retrying.

### Poor Face Identity Preservation

- Use `quality: 'high'` (Nano Banana Pro)
- Provide multiple reference images
- Ensure reference images are clear and well-lit
- Use detailed prompts that describe the desired style

## API Documentation

For more details, see the official Gemini API documentation:
- [Nano Banana Documentation](https://ai.google.dev/gemini-api/docs/nano-banana)
- [Gemini API Reference](https://ai.google.dev/api)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the test script output for diagnostic information
3. Check the logs for detailed error messages
4. Consult the official Gemini API documentation



