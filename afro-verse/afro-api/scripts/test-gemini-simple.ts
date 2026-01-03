// Load environment FIRST
require('dotenv').config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  console.log('Testing Gemini API...\n');

  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey!);
  
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello');
      const text = result.response.text();
      console.log(`✅ ${modelName} works! Response: ${text.substring(0, 50)}...\n`);
      break;
    } catch (error: any) {
      console.log(`✗ ${modelName} failed: ${error.message.split('\n')[0]}\n`);
    }
  }
}

testGemini();
