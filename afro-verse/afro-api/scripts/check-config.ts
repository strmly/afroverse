/**
 * Quick Configuration Check
 * 
 * Checks all required API keys and credentials.
 * 
 * Usage:
 *   ts-node scripts/check-config.ts
 */

// Load environment FIRST
require('dotenv').config();

interface ConfigCheck {
  name: string;
  key: string;
  value: string | undefined;
  required: boolean;
  status?: 'ok' | 'missing' | 'empty';
  guide?: string;
}

function checkConfig() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   AfroMoji API - Configuration Check                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const checks: ConfigCheck[] = [
    // Core
    {
      name: 'MongoDB URI',
      key: 'MONGODB_URI',
      value: process.env.MONGODB_URI,
      required: true,
    },
    {
      name: 'JWT Secret',
      key: 'JWT_SECRET',
      value: process.env.JWT_SECRET,
      required: true,
    },
    
    // GCP
    {
      name: 'GCS Project ID',
      key: 'GCS_PROJECT_ID',
      value: process.env.GCS_PROJECT_ID,
      required: true,
    },
    {
      name: 'GCS Bucket Name',
      key: 'GCS_BUCKET_NAME',
      value: process.env.GCS_BUCKET_NAME,
      required: true,
    },
    {
      name: 'GCS Key File',
      key: 'GCS_KEY_FILE',
      value: process.env.GCS_KEY_FILE,
      required: true,
      guide: 'See GCP_KEY_SETUP.md for download instructions',
    },
    
    // Gemini
    {
      name: 'Gemini API Key',
      key: 'GEMINI_API_KEY',
      value: process.env.GEMINI_API_KEY,
      required: true,
      guide: 'Get from https://aistudio.google.com/apikey',
    },
    
    // Twilio
    {
      name: 'Twilio Account SID',
      key: 'TWILIO_ACCOUNT_SID',
      value: process.env.TWILIO_ACCOUNT_SID,
      required: true,
      guide: 'Get from https://console.twilio.com/',
    },
    {
      name: 'Twilio Auth Token',
      key: 'TWILIO_AUTH_TOKEN',
      value: process.env.TWILIO_AUTH_TOKEN,
      required: true,
      guide: 'Get from https://console.twilio.com/',
    },
    {
      name: 'Twilio Verify Service SID',
      key: 'TWILIO_VERIFY_SERVICE_SID',
      value: process.env.TWILIO_VERIFY_SERVICE_SID,
      required: true,
      guide: 'Run: npm run twilio:create-service',
    },
  ];

  // Determine status for each check
  checks.forEach((check) => {
    if (!check.value) {
      check.status = 'missing';
    } else if (check.value.trim() === '') {
      check.status = 'empty';
    } else {
      check.status = 'ok';
    }
  });

  // Display results
  console.log('=== Configuration Status ===');
  console.log('');

  let hasIssues = false;
  
  checks.forEach((check) => {
    const icon = check.status === 'ok' ? '✅' : '❌';
    const status = check.status === 'ok' ? 'SET' : (check.status || 'unknown').toUpperCase();
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.key}: ${status}`);
    
    if (check.status !== 'ok' && check.guide) {
      console.log(`   → ${check.guide}`);
    }
    
    console.log('');
    
    if (check.status !== 'ok' && check.required) {
      hasIssues = true;
    }
  });

  // Summary
  const okCount = checks.filter((c) => c.status === 'ok').length;
  const totalCount = checks.length;

  console.log('╔════════════════════════════════════════════════════════╗');
  
  if (hasIssues) {
    console.log('║              Configuration Incomplete ⚠️                ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Status: ${okCount}/${totalCount} configured`);
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Edit .env file: nano .env');
    console.log('  2. Add missing values (see guides above)');
    console.log('  3. Run: npm run test:all');
    console.log('');
    console.log('Documentation:');
    console.log('  - GCP Setup: GCP_KEY_SETUP.md');
    console.log('  - Test Results: TEST_RESULTS.md');
    console.log('');
    process.exit(1);
  } else {
    console.log('║              Configuration Complete ✅                  ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('All required configurations are set!');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Setup GCP buckets: npm run setup:buckets');
    console.log('  2. Run all tests: npm run test:all');
    console.log('  3. Start server: npm run dev');
    console.log('');
    process.exit(0);
  }
}

checkConfig();

