/**
 * Fix CORS Configuration for Uploads
 * 
 * Configures GCS bucket to allow PUT requests from browser for direct uploads.
 * 
 * Usage:
 *   ts-node scripts/fix-cors-uploads.ts
 */

// Load environment FIRST
require('dotenv').config();

import { getStorage } from '../src/config/storage';
import { env } from '../src/config/env';

async function fixCorsForUploads() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Fix CORS Configuration for Browser Uploads          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  const bucketName = env.GCS_BUCKET_NAME;
  console.log(`Configuring CORS for bucket: ${bucketName}`);
  console.log('');
  
  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  
  const [exists] = await bucket.exists();
  if (!exists) {
    console.error(`❌ Bucket ${bucketName} does not exist!`);
    console.error('');
    console.error('Please create the bucket manually in Google Cloud Console:');
    console.error(`  https://console.cloud.google.com/storage/browser?project=${env.GCS_PROJECT_ID}`);
    console.error('');
    console.error('Or run: gsutil mb -p ${env.GCS_PROJECT_ID} -l US gs://${bucketName}');
    process.exit(1);
  }
  
  console.log(`✅ Bucket exists: ${bucketName}`);
  console.log('');
  
  try {
    // Configure CORS to allow PUT requests from browser
    console.log('Configuring CORS for browser uploads...');
    await bucket.setCorsConfiguration([
      {
        origin: ['http://localhost:3000', 'http://localhost:3001', '*'], // Allow localhost and all origins for dev
        method: ['GET', 'HEAD', 'PUT', 'OPTIONS'],
        responseHeader: [
          'Content-Type',
          'Content-Length',
          'x-goog-resumable',
          'x-goog-content-length-range',
        ],
        maxAgeSeconds: 3600,
      },
    ]);
    
    console.log('✅ CORS configuration updated successfully!');
    console.log('');
    console.log('Allowed methods: GET, HEAD, PUT, OPTIONS');
    console.log('Allowed origins: http://localhost:3000, http://localhost:3001, *');
    console.log('');
  } catch (error: any) {
    console.error('❌ Failed to configure CORS:', error.message);
    process.exit(1);
  }
}

fixCorsForUploads()
  .then(() => {
    console.log('✅ CORS fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CORS fix failed:', error);
    process.exit(1);
  });

