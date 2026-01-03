/**
 * Create Twilio Verify Service
 * 
 * This script creates a Verify Service in Twilio for OTP via WhatsApp.
 * 
 * Usage:
 *   ts-node scripts/create-twilio-verify-service.ts
 */

import twilio from 'twilio';
import * as fs from 'fs';
import * as path from 'path';

const ACCOUNT_SID = 'AC6e415c4ec7b763967eda5ea684448794';
const AUTH_TOKEN = 'f6ee3cb1e7dabdf3abd727dd644c52d5';

async function createVerifyService() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Creating Twilio Verify Service                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    
    console.log('📡 Connecting to Twilio...');
    
    // Create Verify Service
    const service = await client.verify.v2.services.create({
      friendlyName: 'AfroMoji OTP',
      codeLength: 6,
    });
    
    console.log('✅ Verify Service created successfully!');
    console.log('');
    console.log('Service Details:');
    console.log('  Name:', service.friendlyName);
    console.log('  SID:', service.sid);
    console.log('  Code Length:', service.codeLength);
    console.log('');
    
    // Update .env file
    const envPath = path.join(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      
      if (envContent.includes('TWILIO_VERIFY_SERVICE_SID=')) {
        // Update existing
        envContent = envContent.replace(
          /TWILIO_VERIFY_SERVICE_SID=.*/,
          `TWILIO_VERIFY_SERVICE_SID=${service.sid}`
        );
        console.log('✅ Updated TWILIO_VERIFY_SERVICE_SID in .env');
      } else {
        // Add new
        envContent += `\nTWILIO_VERIFY_SERVICE_SID=${service.sid}\n`;
        console.log('✅ Added TWILIO_VERIFY_SERVICE_SID to .env');
      }
      
      fs.writeFileSync(envPath, envContent);
    } else {
      console.log('⚠️  .env file not found. Please add this manually:');
      console.log(`   TWILIO_VERIFY_SERVICE_SID=${service.sid}`);
    }
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                Setup Complete!                         ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✅ Twilio Verify Service is ready to use');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Test the integration: npm run test:twilio');
    console.log('  2. Start your server: npm run dev');
    console.log('  3. Test onboarding in your app');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Error creating Verify Service:', error.message);
    console.error('');
    
    if (error.code === 20003) {
      console.error('Authentication failed. Please check your credentials.');
    } else if (error.code === 20404) {
      console.error('Resource not found. Your account may not have Verify API access.');
      console.error('Please contact Twilio support to enable Verify API.');
    } else {
      console.error('Full error:', error);
    }
    
    process.exit(1);
  }
}

createVerifyService();



