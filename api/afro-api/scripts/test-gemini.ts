/**
 * Test script for Gemini Nano Banana Pro image generation
 * 
 * Usage:
 *   ts-node scripts/test-gemini.ts
 */

// Load environment FIRST
require('dotenv').config();

import * as fs from 'fs';
import * as path from 'path';
import { generateImage, refineImage, isGeminiConfigured } from '../src/services/gemini.service';
import { logger } from '../src/utils/logger';

async function testBasicGeneration() {
  console.log('\n=== Testing Basic Image Generation ===\n');
  
  if (!isGeminiConfigured()) {
    console.error('❌ Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.');
    return false;
  }
  
  console.log('✅ Gemini API key is configured');
  
  try {
    console.log('Generating image with Nano Banana (gemini-2.5-flash-image)...');
    
    const result = await generateImage({
      prompt: 'Create a picture of a futuristic banana with neon lights in a cyberpunk city.',
      quality: 'standard',
      aspectRatio: '1:1',
    });
    
    // Save the image
    const outputPath = path.join(__dirname, '../test-output-nano-banana.png');
    fs.writeFileSync(outputPath, result.imageData);
    
    console.log(`✅ Image generated successfully!`);
    console.log(`   - Size: ${(result.imageData.length / 1024).toFixed(2)} KB`);
    console.log(`   - MIME Type: ${result.mimeType}`);
    console.log(`   - Saved to: ${outputPath}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    return false;
  }
}

async function testProGeneration() {
  console.log('\n=== Testing Pro Image Generation ===\n');
  
  try {
    console.log('Generating image with Nano Banana Pro (gemini-3-pro-image-preview)...');
    
    const result = await generateImage({
      prompt: 'Create a professional portrait of an African woman in Afrofuturist style with vibrant colors, geometric patterns, and futuristic elements. High quality, centered composition.',
      quality: 'high',
      aspectRatio: '1:1',
    });
    
    // Save the image
    const outputPath = path.join(__dirname, '../test-output-nano-banana-pro.png');
    fs.writeFileSync(outputPath, result.imageData);
    
    console.log(`✅ Image generated successfully!`);
    console.log(`   - Size: ${(result.imageData.length / 1024).toFixed(2)} KB`);
    console.log(`   - MIME Type: ${result.mimeType}`);
    console.log(`   - Saved to: ${outputPath}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    return false;
  }
}

async function testWithSystemInstruction() {
  console.log('\n=== Testing with Custom System Instruction ===\n');
  
  try {
    console.log('Generating image with custom system instruction...');
    
    const result = await generateImage({
      prompt: 'A golden crown with African patterns and precious gems',
      quality: 'high',
      aspectRatio: '1:1',
      systemInstruction: 'You are an expert at creating culturally authentic African art. Focus on traditional patterns, colors, and symbolism while maintaining high artistic quality.',
    });
    
    // Save the image
    const outputPath = path.join(__dirname, '../test-output-custom-instruction.png');
    fs.writeFileSync(outputPath, result.imageData);
    
    console.log(`✅ Image generated successfully!`);
    console.log(`   - Size: ${(result.imageData.length / 1024).toFixed(2)} KB`);
    console.log(`   - MIME Type: ${result.mimeType}`);
    console.log(`   - Saved to: ${outputPath}`);
    
    return true;
  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Gemini Nano Banana Pro - Image Generation Test      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // Create test-output directory
  const outputDir = path.join(__dirname, '..');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const results = {
    basic: await testBasicGeneration(),
    pro: await testProGeneration(),
    custom: await testWithSystemInstruction(),
  };
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`Basic Generation (Nano Banana):     ${results.basic ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Pro Generation (Nano Banana Pro):   ${results.pro ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Custom System Instruction:          ${results.custom ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Gemini Nano Banana Pro is ready to use.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

