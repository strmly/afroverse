/**
 * Test Twilio WhatsApp OTP integration
 * 
 * This script tests the Twilio configuration and OTP flow.
 * 
 * Usage:
 *   ts-node scripts/test-twilio.ts +27821234567
 */

// Load environment FIRST
require('dotenv').config();

import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../src/services/twilio.service';
import { logger } from '../src/utils/logger';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function testTwilioOTP() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Twilio WhatsApp OTP - Integration Test              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Get phone number from args or prompt
    let phoneNumber = process.argv[2];
    
    if (!phoneNumber) {
      phoneNumber = await question('Enter phone number (E.164 format, e.g., +27821234567): ');
    }
    
    if (!phoneNumber.startsWith('+')) {
      console.error('❌ Phone number must be in E.164 format (start with +)');
      rl.close();
      process.exit(1);
    }
    
    console.log('');
    console.log('=== Step 1: Send OTP ===');
    console.log('');
    console.log(`📱 Sending OTP to ${phoneNumber}...`);
    
    const sendResult = await sendWhatsAppOTP(phoneNumber);
    
    if (!sendResult.success) {
      console.error('❌ Failed to send OTP:', sendResult.error);
      console.error('');
      console.error('Common issues:');
      console.error('  1. Twilio credentials not configured');
      console.error('  2. Verify Service not created');
      console.error('  3. Phone number not verified in Twilio (trial accounts)');
      console.error('  4. Insufficient Twilio balance');
      console.error('');
      console.error('Solutions:');
      console.error('  1. Run: npm run setup:twilio');
      console.error('  2. Run: npm run twilio:create-service');
      console.error('  3. Add phone to verified numbers in Twilio Console');
      console.error('');
      rl.close();
      process.exit(1);
    }
    
    console.log('✅ OTP sent successfully!');
    console.log(`   Provider Ref: ${sendResult.providerRef}`);
    console.log('');
    console.log('📲 Check WhatsApp for the verification code');
    console.log('');
    
    console.log('=== Step 2: Verify OTP ===');
    console.log('');
    
    const code = await question('Enter the 6-digit code you received: ');
    
    if (code.length !== 6) {
      console.error('❌ Code must be 6 digits');
      rl.close();
      process.exit(1);
    }
    
    console.log('');
    console.log('🔐 Verifying code...');
    
    const verifyResult = await verifyWhatsAppOTP(phoneNumber, code);
    
    if (!verifyResult.success) {
      console.error('❌ Verification failed:', verifyResult.error);
      console.error(`   Status: ${verifyResult.status}`);
      console.error('');
      
      if (verifyResult.status === 'denied') {
        console.error('The code you entered is incorrect. Please try again.');
      } else if (verifyResult.status === 'expired') {
        console.error('The code has expired. Please request a new one.');
      }
      
      rl.close();
      process.exit(1);
    }
    
    console.log('✅ Verification successful!');
    console.log(`   Status: ${verifyResult.status}`);
    console.log('');
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              Test Complete - SUCCESS! ✅                ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🎉 Your Twilio WhatsApp OTP integration is working!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start your API server: npm run dev');
    console.log('  2. Test onboarding in your web app');
    console.log('  3. Enter a phone number and verify with OTP');
    console.log('');
    
    rl.close();
    
  } catch (error: any) {
    console.error('');
    console.error('❌ Test failed with error:', error.message);
    console.error('');
    
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    console.error('');
    rl.close();
    process.exit(1);
  }
}

testTwilioOTP();

