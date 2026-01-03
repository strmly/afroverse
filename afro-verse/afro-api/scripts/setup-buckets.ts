/**
 * Setup GCS Buckets
 * 
 * Creates all required buckets according to the AfroMoji bucket spec.
 * 
 * Usage:
 *   npx ts-node scripts/setup-buckets.ts
 */

// Load environment FIRST
require('dotenv').config();

import { getStorage } from '../src/config/storage';
import { BUCKETS, BUCKET_CONFIGS, LIFECYCLE } from '../src/config/buckets';
import { logger } from '../src/utils/logger';

async function setupBuckets() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   AfroMoji GCS Bucket Setup                            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  const storage = getStorage();

  const bucketsToCreate = [
    {
      name: BUCKETS.RAW_GENERATIONS,
      config: BUCKET_CONFIGS[BUCKETS.RAW_GENERATIONS],
    },
    {
      name: BUCKETS.TRANSFORMATIONS,
      config: BUCKET_CONFIGS[BUCKETS.TRANSFORMATIONS],
    },
    {
      name: BUCKETS.DERIVATIVES,
      config: BUCKET_CONFIGS[BUCKETS.DERIVATIVES],
    },
    {
      name: BUCKETS.PRIVATE_GALLERY,
      config: BUCKET_CONFIGS[BUCKETS.PRIVATE_GALLERY],
    },
    {
      name: BUCKETS.ARCHIVE,
      config: BUCKET_CONFIGS[BUCKETS.ARCHIVE],
    },
  ];

  for (const { name, config } of bucketsToCreate) {
    console.log(`\nChecking bucket: ${name}`);
    
    const bucket = storage.bucket(name);
    const [exists] = await bucket.exists();

    if (exists) {
      console.log(`  ✅ Bucket exists`);
      
      // Update bucket configuration if needed
      try {
        // Set public access if configured
        if (config.public) {
          console.log(`  📝 Setting public access...`);
          await bucket.makePublic();
        }

        // Set lifecycle rules if configured
        if (config.ttl) {
          console.log(`  📝 Setting lifecycle rules (TTL: ${config.ttl}s)...`);
          await bucket.setMetadata({
            lifecycle: {
              rule: [
                {
                  action: { type: 'Delete' },
                  condition: { age: Math.floor(config.ttl / 86400) }, // Convert seconds to days
                },
              ],
            },
          });
        }

        // Set CORS for private gallery (for signed URL uploads)
        if (name === BUCKETS.PRIVATE_GALLERY) {
          console.log(`  📝 Setting CORS for signed URL uploads...`);
          await bucket.setCorsConfiguration([
            {
              origin: ['http://localhost:3000', 'http://localhost:3001', '*'],
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
        }

        console.log(`  ✅ Configuration updated`);
      } catch (error: any) {
        console.log(`  ⚠️  Warning: Could not update configuration: ${error.message}`);
      }
    } else {
      console.log(`  ❌ Bucket does not exist`);
      console.log(`  📝 Creating bucket...`);

      try {
        await bucket.create({
          location: 'US',
          storageClass: 'STANDARD',
        });

        console.log(`  ✅ Bucket created`);

        // Apply configuration
        if (config.public) {
          console.log(`  📝 Setting public access...`);
          await bucket.makePublic();
        }

        if (config.ttl) {
          console.log(`  📝 Setting lifecycle rules...`);
          await bucket.setMetadata({
            lifecycle: {
              rule: [
                {
                  action: { type: 'Delete' },
                  condition: { age: Math.floor(config.ttl / 86400) },
                },
              ],
            },
          });
        }

        if (name === BUCKETS.PRIVATE_GALLERY) {
          console.log(`  📝 Setting CORS...`);
          await bucket.setCorsConfiguration([
            {
              origin: ['http://localhost:3000', 'http://localhost:3001', '*'],
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
        }

        console.log(`  ✅ Configuration applied`);
      } catch (error: any) {
        console.log(`  ❌ Failed to create bucket: ${error.message}`);
        console.log('');
        console.log('  Please create the bucket manually:');
        console.log(`    gsutil mb -p ${process.env.GCS_PROJECT_ID} -l US gs://${name}`);
        console.log('');
      }
    }
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Bucket Setup Complete                                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Summary:');
  console.log(`  - RAW_GENERATIONS: ${BUCKETS.RAW_GENERATIONS}`);
  console.log(`  - TRANSFORMATIONS: ${BUCKETS.TRANSFORMATIONS}`);
  console.log(`  - DERIVATIVES: ${BUCKETS.DERIVATIVES}`);
  console.log(`  - PRIVATE_GALLERY: ${BUCKETS.PRIVATE_GALLERY}`);
  console.log(`  - ARCHIVE: ${BUCKETS.ARCHIVE}`);
  console.log('');
}

setupBuckets()
  .then(() => {
    console.log('✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
