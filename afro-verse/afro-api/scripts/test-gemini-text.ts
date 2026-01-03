// Load environment FIRST
require('dotenv').config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Basic Test                             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Test text generation
    console.log('=== Testing Text Generation ===');
    console.log('');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('Write a short haiku about coding');
    const response = result.response;
    const text = response.text();
    
    console.log('✅ Text generation successful!');
    console.log('');
    console.log('Generated haiku:');
    console.log(text);
    console.log('');
    
    // Note about image generation
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    Important Note                      ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('⚠️  Gemini models (gemini-2.0-flash, gemini-1.5-pro) are');
    console.log('   designed for TEXT generation and VISION (understanding');
    console.log('   images), NOT for generating images.');
    console.log('');
    console.log('For IMAGE GENERATION, you should use:');
    console.log('  • Imagen API (imagen-3.0-generate-001)');
    console.log('  • Vertex AI Image Generation');
    console.log('  • Or other image generation models');
    console.log('');
    console.log('✅ Gemini API key is valid and working for text/vision!');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testGemini();
