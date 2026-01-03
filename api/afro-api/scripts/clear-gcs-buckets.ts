import * as dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';

// Load environment variables
dotenv.config();

// Bucket names (hardcoded to avoid importing env validation)
const BUCKETS = {
  PRIVATE_GALLERY: 'afromoji-private-gallery',
  RAW_GENERATIONS: 'afromoji-raw-generations',
};

// Initialize storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE || './gcp-key.json',
});

function getBucket(bucketName: string) {
  return storage.bucket(bucketName);
}

/**
 * Clear GCS Buckets Script
 * 
 * Deletes all files from user-content buckets:
 * - PRIVATE_GALLERY (user selfies)
 * - RAW_GENERATIONS (AI-generated images)
 * 
 * Usage: npm run clear-buckets
 */

async function clearBucket(bucketName: string) {
  try {
    console.log(`\n🗑️  Clearing bucket: ${bucketName}`);
    
    const bucket = getBucket(bucketName);
    const [files] = await bucket.getFiles();
    
    if (files.length === 0) {
      console.log(`   ⏭️  Already empty`);
      return 0;
    }
    
    console.log(`   📊 Found ${files.length} files`);
    console.log(`   🗑️  Deleting...`);
    
    // Delete in batches of 100
    const batchSize = 100;
    let deleted = 0;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(batch.map(file => file.delete()));
      deleted += batch.length;
      console.log(`   ✅ Deleted ${deleted}/${files.length} files`);
    }
    
    return deleted;
  } catch (error: any) {
    console.error(`   ❌ Error clearing ${bucketName}:`, error.message);
    return 0;
  }
}

async function clearAllBuckets() {
  console.log('🗑️  GCS BUCKETS CLEANUP SCRIPT\n');
  console.log('⚠️  WARNING: This will delete ALL uploaded files!\n');

  try {
    const bucketsToClean = [
      BUCKETS.PRIVATE_GALLERY,
      BUCKETS.RAW_GENERATIONS,
    ];

    console.log('📦 Buckets to clean:');
    bucketsToClean.forEach(b => console.log(`   - ${b}`));

    let totalDeleted = 0;

    for (const bucketName of bucketsToClean) {
      const deleted = await clearBucket(bucketName);
      totalDeleted += deleted;
    }

    console.log('\n✅ Cleanup complete!');
    console.log(`\n📝 Summary:`);
    console.log(`   - Total files deleted: ${totalDeleted}`);
    console.log(`   - Buckets cleaned: ${bucketsToClean.length}`);
    console.log('\n🚀 Storage ready for fresh start!');

  } catch (error: any) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Confirm before running
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  clearAllBuckets();
} else {
  console.log('🗑️  GCS BUCKETS CLEANUP SCRIPT\n');
  console.log('⚠️  WARNING: This will delete ALL uploaded files!\n');
  console.log('This will delete all files from:');
  console.log(`  - ${BUCKETS.PRIVATE_GALLERY} (user selfies)`);
  console.log(`  - ${BUCKETS.RAW_GENERATIONS} (AI-generated images)\n`);
  console.log('To proceed, run:');
  console.log('  npm run clear-buckets -- --confirm\n');
  process.exit(0);
}

