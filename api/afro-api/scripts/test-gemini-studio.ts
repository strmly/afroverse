// Load environment FIRST
require('dotenv').config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiStudio() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Testing Gemini with AI Studio Compatible Models     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey!);
  
  // Models that work in AI Studio
  const modelsToTest = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-8b-latest',
    'gemini-exp-1206',
  ];

  console.log('Testing models that work in AI Studio...\n');

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent('Write a haiku about coding');
      const text = result.response.text();
      
      console.log(`✅ SUCCESS! ${modelName} is working!\n`);
      console.log('Generated haiku:');
      console.log('─'.repeat(50));
      console.log(text);
      console.log('─'.repeat(50));
      console.log('');
      
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║              🎉 Gemini API Working! 🎉                 ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`Working model: ${modelName}`);
      console.log(`API Key: Valid ✓`);
      console.log(`Status: Fully operational`);
      console.log('');
      console.log('Note: This model is for TEXT generation and VISION.');
      console.log('For IMAGE generation, use:');
      console.log('  • Imagen 3 (Google)');
      console.log('  • Replicate (Stable Diffusion, Flux)');
      console.log('  • FAL.ai');
      console.log('');
      
      process.exit(0);
      
    } catch (error: any) {
      const errorMsg = error.message.split('\n')[0];
      if (errorMsg.includes('404')) {
        console.log(`✗ ${modelName} - Not available\n`);
      } else if (errorMsg.includes('403') || errorMsg.includes('permission')) {
        console.log(`✗ ${modelName} - Permission denied\n`);
      } else {
        console.log(`✗ ${modelName} - ${errorMsg.substring(0, 60)}...\n`);
      }
    }
  }
  
  console.log('❌ None of the models are accessible yet.');
  console.log('');
  console.log('Since your key works in AI Studio, try:');
  console.log('  1. Wait another 5-10 minutes');
  console.log('  2. Check billing is enabled');
  console.log('  3. Verify API restrictions on the key');
  console.log('');
  process.exit(1);
}

testGeminiStudio();
