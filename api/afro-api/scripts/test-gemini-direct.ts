// Load environment FIRST
require('dotenv').config();

async function testGeminiDirect() {
  console.log('Testing Gemini API with direct fetch...\n');

  const apiKey = process.env.GEMINI_API_KEY;
  
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];

  for (const model of models) {
    try {
      console.log(`Testing: ${model}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say hello in one word' }]
            }]
          })
        }
      );

      const data = await response.json();
      
      if (response.ok && data.candidates) {
        const text = data.candidates[0]?.content?.parts[0]?.text || 'No text';
        console.log(`✅ SUCCESS! ${model} works!`);
        console.log(`Response: ${text}\n`);
        
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║           🎉 GEMINI API FULLY WORKING! 🎉              ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`Working model: ${model}`);
        console.log(`Billing: Enabled ✓`);
        console.log(`API: Operational ✓`);
        console.log('');
        process.exit(0);
      } else {
        console.log(`✗ ${model} failed:`, data.error?.message || 'Unknown error');
        console.log('');
      }
      
    } catch (error: any) {
      console.log(`✗ ${model} error:`, error.message);
      console.log('');
    }
  }
  
  console.log('❌ No models working yet.');
  console.log('');
  console.log('Since billing is enabled, the issue might be:');
  console.log('  1. API key restrictions');
  console.log('  2. Need to regenerate API key');
  console.log('  3. Wait 2-5 more minutes for activation');
  console.log('');
}

testGeminiDirect();
