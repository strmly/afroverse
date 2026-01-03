require('dotenv').config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testNanoBananaModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  console.log('Testing Nano Banana models...\n');
  
  // Test gemini-2.5-flash-image
  try {
    console.log('1. Testing gemini-2.5-flash-image (Nano Banana)...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    console.log('   ✅ Model initialized successfully');
    
    // Try a simple generation
    console.log('   Testing simple image generation...');
    const result = await model.generateContent('A simple red circle on white background');
    console.log('   ✅ Generation test passed');
  } catch (err: any) {
    console.log('   ❌ Error:', err.message);
  }
  
  // Test gemini-3-pro-image-preview
  try {
    console.log('\n2. Testing gemini-3-pro-image-preview (Nano Banana Pro)...');
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });
    console.log('   ✅ Model initialized successfully');
    
    // Try a simple generation
    console.log('   Testing simple image generation...');
    const result = await model.generateContent('A simple blue square on white background');
    console.log('   ✅ Generation test passed');
  } catch (err: any) {
    console.log('   ❌ Error:', err.message);
  }
  
  console.log('\n✅ Model configuration test complete!');
}

testNanoBananaModels().catch(console.error);



