/**
 * Example usage of Gemini Nano Banana Pro service
 * 
 * This file demonstrates various ways to use the Gemini image generation service.
 */

import { generateImage, refineImage, buildUserPrompt } from '../src/services/gemini.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example 1: Basic image generation
 */
async function example1_basicGeneration() {
  console.log('\n=== Example 1: Basic Image Generation ===\n');
  
  const result = await generateImage({
    prompt: 'Create a picture of a futuristic banana with neon lights in a cyberpunk city.',
    quality: 'standard',
    aspectRatio: '1:1',
  });
  
  console.log('✅ Generated image:', {
    size: `${(result.imageData.length / 1024).toFixed(2)} KB`,
    mimeType: result.mimeType,
  });
  
  return result;
}

/**
 * Example 2: High-quality generation with Nano Banana Pro
 */
async function example2_proGeneration() {
  console.log('\n=== Example 2: Pro Generation (High Quality) ===\n');
  
  const result = await generateImage({
    prompt: 'Professional portrait of an African woman in Afrofuturist style with vibrant colors, geometric patterns, and futuristic elements. Centered composition, high quality.',
    quality: 'high', // Uses Nano Banana Pro
    aspectRatio: '1:1',
  });
  
  console.log('✅ Generated high-quality image:', {
    size: `${(result.imageData.length / 1024).toFixed(2)} KB`,
    mimeType: result.mimeType,
  });
  
  return result;
}

/**
 * Example 3: Generation with reference image (face preservation)
 */
async function example3_withReferenceImage() {
  console.log('\n=== Example 3: Generation with Reference Image ===\n');
  
  // In a real scenario, you would load a user's selfie
  // For this example, we'll demonstrate the structure
  
  // const selfieBuffer = fs.readFileSync('path/to/user-selfie.jpg');
  
  const result = await generateImage({
    prompt: 'Transform this person into an Afrofuturist warrior with traditional African patterns, futuristic armor, and vibrant colors. Preserve their facial features and identity.',
    quality: 'high', // Pro is better for face preservation
    aspectRatio: '1:1',
    // images: [selfieBuffer], // Uncomment when you have a real image
  });
  
  console.log('✅ Generated image with face preservation:', {
    size: `${(result.imageData.length / 1024).toFixed(2)} KB`,
    mimeType: result.mimeType,
  });
  
  return result;
}

/**
 * Example 4: Using preset styles with buildUserPrompt
 */
async function example4_presetStyles() {
  console.log('\n=== Example 4: Using Preset Styles ===\n');
  
  const prompt = buildUserPrompt({
    presetId: 'afrofuturism',
    userPrompt: 'wearing a golden crown with LED lights',
    aspectRatio: '1:1',
  });
  
  console.log('Built prompt:', prompt);
  
  const result = await generateImage({
    prompt,
    quality: 'high',
    aspectRatio: '1:1',
  });
  
  console.log('✅ Generated image with preset style:', {
    size: `${(result.imageData.length / 1024).toFixed(2)} KB`,
    mimeType: result.mimeType,
  });
  
  return result;
}

/**
 * Example 5: Custom system instruction
 */
async function example5_customSystemInstruction() {
  console.log('\n=== Example 5: Custom System Instruction ===\n');
  
  const result = await generateImage({
    prompt: 'A majestic lion wearing a golden crown with traditional African patterns',
    quality: 'high',
    aspectRatio: '1:1',
    systemInstruction: `You are an expert at creating culturally authentic African art.
    
Guidelines:
- Use traditional African color palettes (earth tones, vibrant reds, golds, blues)
- Incorporate authentic African patterns (Adinkra, Kente, geometric designs)
- Respect cultural symbolism and meaning
- Create high-quality, professional artwork
- Avoid stereotypes and caricatures`,
  });
  
  console.log('✅ Generated image with custom instruction:', {
    size: `${(result.imageData.length / 1024).toFixed(2)} KB`,
    mimeType: result.mimeType,
  });
  
  return result;
}

/**
 * Example 6: Image refinement
 */
async function example6_imageRefinement() {
  console.log('\n=== Example 6: Image Refinement ===\n');
  
  // First, generate a base image
  const baseResult = await generateImage({
    prompt: 'Portrait of an African warrior in traditional attire',
    quality: 'high',
    aspectRatio: '1:1',
  });
  
  console.log('✅ Generated base image');
  
  // Now refine it
  const refinedResult = await refineImage({
    baseImage: baseResult.imageData,
    instruction: 'Add a golden crown with precious gems to the warrior',
    quality: 'high',
    aspectRatio: '1:1',
    prompt: '', // Required but not used in refinement
  });
  
  console.log('✅ Refined image:', {
    size: `${(refinedResult.imageData.length / 1024).toFixed(2)} KB`,
    mimeType: refinedResult.mimeType,
  });
  
  return refinedResult;
}

/**
 * Example 7: Error handling
 */
async function example7_errorHandling() {
  console.log('\n=== Example 7: Error Handling ===\n');
  
  try {
    // This might trigger content blocking
    const result = await generateImage({
      prompt: 'Test prompt',
      quality: 'standard',
      aspectRatio: '1:1',
    });
    
    console.log('✅ Generation successful');
  } catch (error: any) {
    if (error.message === 'BLOCKED') {
      console.log('⚠️  Content was blocked by safety filters');
      // Handle blocked content - maybe try a different prompt
    } else if (error.message === 'RATE_LIMITED') {
      console.log('⚠️  Rate limit exceeded - implement backoff');
      // Implement exponential backoff
    } else if (error.message === 'Gemini API not configured') {
      console.log('❌ API key not configured');
      // Prompt user to configure API key
    } else {
      console.log('❌ Unknown error:', error.message);
      // Handle other errors
    }
  }
}

/**
 * Example 8: Batch generation with different qualities
 */
async function example8_batchGeneration() {
  console.log('\n=== Example 8: Batch Generation ===\n');
  
  const prompts = [
    { text: 'Afrofuturist warrior', quality: 'standard' as const },
    { text: 'Royal African queen', quality: 'high' as const },
    { text: 'Modern street style portrait', quality: 'standard' as const },
  ];
  
  const results = await Promise.all(
    prompts.map(({ text, quality }) =>
      generateImage({
        prompt: text,
        quality,
        aspectRatio: '1:1',
      })
    )
  );
  
  console.log(`✅ Generated ${results.length} images in batch`);
  results.forEach((result, i) => {
    console.log(`   ${i + 1}. ${prompts[i].text} (${prompts[i].quality}): ${(result.imageData.length / 1024).toFixed(2)} KB`);
  });
  
  return results;
}

/**
 * Example 9: Portrait aspect ratio (9:16)
 */
async function example9_portraitAspectRatio() {
  console.log('\n=== Example 9: Portrait Aspect Ratio (9:16) ===\n');
  
  const result = await generateImage({
    prompt: 'Full-body portrait of an African dancer in traditional attire with vibrant colors',
    quality: 'high',
    aspectRatio: '9:16', // Portrait orientation
  });
  
  console.log('✅ Generated portrait image:', {
    size: `${(result.imageData.length / 1024).toFixed(2)} KB`,
    mimeType: result.mimeType,
    aspectRatio: '9:16',
  });
  
  return result;
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Gemini Nano Banana Pro - Usage Examples           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    // Run examples
    await example1_basicGeneration();
    await example2_proGeneration();
    await example3_withReferenceImage();
    await example4_presetStyles();
    await example5_customSystemInstruction();
    await example6_imageRefinement();
    await example7_errorHandling();
    await example8_batchGeneration();
    await example9_portraitAspectRatio();
    
    console.log('\n✅ All examples completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  require('dotenv').config();
  main();
}

// Export for use in other files
export {
  example1_basicGeneration,
  example2_proGeneration,
  example3_withReferenceImage,
  example4_presetStyles,
  example5_customSystemInstruction,
  example6_imageRefinement,
  example7_errorHandling,
  example8_batchGeneration,
  example9_portraitAspectRatio,
};



