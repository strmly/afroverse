// Load environment FIRST
require('dotenv').config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Gemini API - Testing After Enabling API             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  console.log('=== Testing Text Generation ===');
  console.log('');

  const modelsToTest = [
    { name: 'gemini-1.5-flash', desc: 'Fast model' },
    { name: 'gemini-1.5-pro', desc: 'Pro model' },
    { name: 'gemini-pro', desc: 'Standard model' },
  ];

  let workingModel: string | null = null;

  for (const { name, desc } of modelsToTest) {
    try {
      console.log(`Testing ${name} (${desc})...`);
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent('Say hello in one word');
      const text = result.response.text();
      
      console.log(`✅ ${name} WORKS!`);
      console.log(`   Response: "${text}"`);
      console.log('');
      
      workingModel = name;
      break;
    } catch (error: any) {
      console.log(`✗ ${name} failed`);
      console.log(`   Error: ${error.message.split('\n')[0].substring(0, 80)}...`);
      console.log('');
    }
  }

  if (workingModel) {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              Gemini API Working! ✅                     ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Working model: ${workingModel}`);
    console.log('');
    console.log('Note: Gemini is for TEXT and VISION, not image generation.');
    console.log('For image generation, consider:');
    console.log('  • Imagen API (Google)');
    console.log('  • Replicate (Stable Diffusion, Flux, etc.)');
    console.log('  • FAL.ai');
    console.log('  • OpenAI DALL-E');
    console.log('');
    process.exit(0);
  } else {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              No Models Available ❌                     ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('The API is enabled but models may need time to activate.');
    console.log('Wait 5-10 minutes and try again.');
    console.log('');
    process.exit(1);
  }
}

testGemini();
