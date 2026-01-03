// Load environment FIRST
require('dotenv').config();

async function listModels() {
  console.log('Listing available models with your API key...\n');

  const apiKey = process.env.GEMINI_API_KEY;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const data = await response.json();
    
    if (response.ok && data.models) {
      console.log(`✅ Found ${data.models.length} models:\n`);
      
      for (const model of data.models) {
        const name = model.name.replace('models/', '');
        const methods = model.supportedGenerationMethods || [];
        const supportsGenerate = methods.includes('generateContent');
        
        console.log(`${supportsGenerate ? '✅' : '⚠️ '} ${name}`);
        console.log(`   Methods: ${methods.join(', ')}`);
        console.log('');
      }
      
      const generateModels = data.models.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (generateModels.length > 0) {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║          Models Available for Text Generation          ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log('');
        generateModels.forEach((m: any) => {
          console.log(`  • ${m.name.replace('models/', '')}`);
        });
        console.log('');
      }
      
    } else {
      console.log('❌ Error:', data.error?.message || 'Failed to list models');
      console.log('');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
}

listModels();
