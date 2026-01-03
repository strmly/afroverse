// Load environment FIRST
require('dotenv').config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log('Fetching available Gemini models...\n');
    
    // Try common image generation models
    const modelsToTest = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro-vision',
      'imagen-3.0-generate-001',
      'imagegeneration@006',
    ];

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`✓ ${modelName} - Available`);
      } catch (error: any) {
        console.log(`✗ ${modelName} - ${error.message.split('\n')[0]}`);
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

listModels();
