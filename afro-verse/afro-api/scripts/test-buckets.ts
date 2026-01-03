/**
 * GCS Bucket Verification Script
 * 
 * Verifies all buckets exist and are properly configured.
 * 
 * Usage:
 *   ts-node scripts/test-buckets.ts
 */

// Load environment FIRST before any imports
require('dotenv').config();

import { BUCKETS, BUCKET_CONFIGS } from '../src/config/buckets';
import * as StorageService from '../src/services/storage.service';

async function testBuckets() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   GCS Bucket Verification                              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Verify all buckets
  const verification = await StorageService.verifyBuckets();
  
  console.log('=== Bucket Existence Check ===');
  console.log('');
  
  if (verification.success) {
    console.log('✅ All buckets exist!');
    console.log('');
    
    for (const bucket of verification.existing) {
      const config = BUCKET_CONFIGS[bucket];
      console.log(`✓ ${bucket}`);
      console.log(`  Visibility: ${config.public ? 'PUBLIC' : 'PRIVATE'}`);
      console.log(`  CDN: ${config.cdn ? 'ENABLED' : 'DISABLED'}`);
      console.log(`  TTL: ${config.ttl ? `${Math.floor(config.ttl / (24 * 60 * 60))} days` : 'None'}`);
      console.log('');
    }
  } else {
    console.log('❌ Some buckets are missing!');
    console.log('');
    
    if (verification.existing.length > 0) {
      console.log('Existing buckets:');
      verification.existing.forEach(bucket => console.log(`  ✓ ${bucket}`));
      console.log('');
    }
    
    if (verification.missing.length > 0) {
      console.log('Missing buckets:');
      verification.missing.forEach(bucket => console.log(`  ✗ ${bucket}`));
      console.log('');
    }
    
    console.log('To create missing buckets, run:');
    console.log('  npm run setup:buckets');
    console.log('');
    
    process.exit(1);
  }
  
  // Test file operations
  console.log('=== File Operations Test ===');
  console.log('');
  
  const testData = Buffer.from('Test data for AfroMoji bucket verification');
  const testPath = `test/verification_${Date.now()}.txt`;
  
  try {
    console.log('Testing upload...');
    
    const uploadResult = await StorageService.uploadBuffer(
      BUCKETS.RAW_GENERATIONS,
      testPath,
      testData,
      {
        contentType: 'text/plain',
        metadata: {
          test: 'true',
        },
      }
    );
    
    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }
    
    console.log('✓ Upload successful');
    
    console.log('Testing download...');
    
    const downloadResult = await StorageService.downloadFile(
      BUCKETS.RAW_GENERATIONS,
      testPath
    );
    
    if (!downloadResult.success || !downloadResult.buffer) {
      throw new Error(`Download failed: ${downloadResult.error}`);
    }
    
    if (downloadResult.buffer.toString() !== testData.toString()) {
      throw new Error('Downloaded data does not match uploaded data');
    }
    
    console.log('✓ Download successful');
    
    console.log('Testing delete...');
    
    const deleteResult = await StorageService.deleteFile(
      BUCKETS.RAW_GENERATIONS,
      testPath
    );
    
    if (!deleteResult.success) {
      throw new Error(`Delete failed: ${deleteResult.error}`);
    }
    
    console.log('✓ Delete successful');
    console.log('');
    
    console.log('✅ All file operations passed!');
  } catch (error: any) {
    console.error('❌ File operations failed:', error.message);
    console.log('');
    process.exit(1);
  }
  
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║              Verification Complete! ✅                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('All buckets are properly configured and operational.');
  console.log('');
}

testBuckets()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });

