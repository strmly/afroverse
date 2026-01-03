/**
 * Simple Twilio Configuration Test (No interaction required)
 * 
 * Tests that Twilio credentials are configured correctly.
 * 
 * Usage:
 *   ts-node scripts/test-twilio-simple.ts
 */

// Load environment FIRST
require('dotenv').config();

import twilio from 'twilio';

async function testTwilioConfig() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Twilio Configuration Test                            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  // Check environment variables
  console.log('=== Environment Variables ===');
  console.log('');
  
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
  
  const hasAccountSid = !!TWILIO_ACCOUNT_SID;
  const hasAuthToken = !!TWILIO_AUTH_TOKEN;
  const hasVerifyService = !!TWILIO_VERIFY_SERVICE_SID;
  
  console.log(`TWILIO_ACCOUNT_SID:       ${hasAccountSid ? '✓ Set' : '✗ Missing'}`);
  console.log(`TWILIO_AUTH_TOKEN:        ${hasAuthToken ? '✓ Set' : '✗ Missing'}`);
  console.log(`TWILIO_VERIFY_SERVICE_SID: ${hasVerifyService ? '✓ Set' : '✗ Missing'}`);
  console.log('');
  
  if (!hasAccountSid || !hasAuthToken) {
    console.log('❌ Missing required Twilio credentials');
    console.log('');
    console.log('Please configure in .env:');
    console.log('  TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('  TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('  TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid');
    console.log('');
    process.exit(1);
  }
  
  // Test connection
  console.log('=== Testing Twilio Connection ===');
  console.log('');
  
  try {
    const client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
    
    // Fetch account info
    const account = await client.api.accounts(TWILIO_ACCOUNT_SID!).fetch();
    
    console.log('✓ Successfully connected to Twilio');
    console.log(`  Account SID: ${account.sid}`);
    console.log(`  Status: ${account.status}`);
    console.log(`  Type: ${account.type}`);
    console.log('');
    
    // Test Verify Service if configured
    if (hasVerifyService) {
      console.log('=== Testing Verify Service ===');
      console.log('');
      
      try {
        const service = await client.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID!)
          .fetch();
        
        console.log('✓ Verify Service found');
        console.log(`  Service SID: ${service.sid}`);
        console.log(`  Friendly Name: ${service.friendlyName}`);
        console.log(`  Status: Active`);
        console.log('');
      } catch (error: any) {
        console.log('✗ Verify Service not found or inaccessible');
        console.log(`  Error: ${error.message}`);
        console.log('');
        console.log('To create a Verify Service:');
        console.log('  npm run twilio:create-service');
        console.log('');
      }
    } else {
      console.log('⚠️  TWILIO_VERIFY_SERVICE_SID not configured');
      console.log('');
      console.log('To create a Verify Service:');
      console.log('  npm run twilio:create-service');
      console.log('');
    }
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              Configuration Valid! ✅                    ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('To test OTP sending (requires phone number):');
    console.log('  npm run test:twilio');
    console.log('');
    
  } catch (error: any) {
    console.log('❌ Failed to connect to Twilio');
    console.log(`   Error: ${error.message}`);
    console.log('');
    
    if (error.code === 20003) {
      console.log('Authentication failed. Check your credentials:');
      console.log('  - TWILIO_ACCOUNT_SID should start with "AC"');
      console.log('  - TWILIO_AUTH_TOKEN should be 32 characters');
    }
    
    console.log('');
    process.exit(1);
  }
}

testTwilioConfig()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

