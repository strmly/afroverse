import fs from 'fs/promises';
import path from 'path';
import {
  applyWatermarks,
  createWatermarkMetadata,
  extractInvisibleWatermark,
  verifyWatermark,
} from '../src/services/watermark.service';

/**
 * Test script for watermarking functionality
 * 
 * Usage: npm run test-watermark
 */

async function testWatermarking() {
  console.log('🧪 Testing AfroMoji Watermarking System\n');

  try {
    // Create a test image buffer (1024x1024 solid color)
    const sharp = require('sharp');
    const testImageBuffer = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 147, g: 51, b: 234, alpha: 1 }, // AfroMoji purple
      },
    })
      .png()
      .toBuffer();

    console.log('✅ Created test image (1024x1024)');

    // Create watermark metadata
    const metadata = createWatermarkMetadata('test-transformation-123', 'public');
    console.log('\n📝 Watermark Metadata:');
    console.log(JSON.stringify(metadata, null, 2));

    // Apply watermarks
    console.log('\n🎨 Applying watermarks...');
    const result = await applyWatermarks(testImageBuffer, {
      applyVisibleWatermark: true,
      applyInvisibleWatermark: true,
      metadata,
    });

    console.log('✅ Watermarks applied successfully');
    console.log(`   - Watermarked size: ${result.watermarked.length} bytes`);
    console.log(`   - Clean size: ${result.clean.length} bytes`);

    // Save test outputs
    const outputDir = path.join(__dirname, '../test-output');
    await fs.mkdir(outputDir, { recursive: true });

    const watermarkedPath = path.join(outputDir, 'test-watermarked.png');
    const cleanPath = path.join(outputDir, 'test-clean.png');

    await fs.writeFile(watermarkedPath, result.watermarked);
    await fs.writeFile(cleanPath, result.clean);

    console.log(`\n💾 Saved test images:`);
    console.log(`   - Watermarked: ${watermarkedPath}`);
    console.log(`   - Clean: ${cleanPath}`);

    // Extract invisible watermark
    console.log('\n🔍 Extracting invisible watermark...');
    const extracted = await extractInvisibleWatermark(result.watermarked);

    if (extracted) {
      console.log('✅ Invisible watermark extracted:');
      console.log(JSON.stringify(extracted, null, 2));
    } else {
      console.log('❌ Failed to extract invisible watermark');
    }

    // Verify watermark
    console.log('\n✓ Verifying watermark...');
    const isValid = await verifyWatermark(result.watermarked, 'test-transformation-123');

    if (isValid) {
      console.log('✅ Watermark verification passed');
    } else {
      console.log('❌ Watermark verification failed');
    }

    // Test without visible watermark
    console.log('\n🎨 Testing without visible watermark...');
    const invisibleOnly = await applyWatermarks(testImageBuffer, {
      applyVisibleWatermark: false,
      applyInvisibleWatermark: true,
      metadata,
    });

    const invisibleOnlyPath = path.join(outputDir, 'test-invisible-only.png');
    await fs.writeFile(invisibleOnlyPath, invisibleOnly.watermarked);
    console.log(`✅ Saved invisible-only image: ${invisibleOnlyPath}`);

    // Verify invisible-only watermark
    const invisibleValid = await verifyWatermark(invisibleOnly.watermarked, 'test-transformation-123');
    console.log(`✓ Invisible-only verification: ${invisibleValid ? 'PASSED' : 'FAILED'}`);

    console.log('\n🎉 All watermarking tests completed!');
    console.log('\n📁 Check test-output/ directory for generated images');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testWatermarking();



