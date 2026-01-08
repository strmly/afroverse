const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, '../public/icons/app-icon.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // Check if source icon exists
    if (!fs.existsSync(sourceIcon)) {
      console.error(`Source icon not found: ${sourceIcon}`);
      process.exit(1);
    }

    console.log('Generating PWA icons...');
    console.log(`Source: ${sourceIcon}`);

    // Get image metadata to understand format
    const metadata = await sharp(sourceIcon).metadata();
    console.log(`Image format: ${metadata.format}, size: ${metadata.width}x${metadata.height}`);

    // Generate icon-192.png
    await sharp(sourceIcon)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 10, alpha: 1 } // #0A0A0A background
      })
      .toFormat('png')
      .toFile(path.join(outputDir, 'icon-192.png'));

    console.log('✅ Created icon-192.png');

    // Generate icon-512.png
    await sharp(sourceIcon)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 10, alpha: 1 } // #0A0A0A background
      })
      .toFormat('png')
      .toFile(path.join(outputDir, 'icon-512.png'));

    console.log('✅ Created icon-512.png');
    console.log('\n✨ PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error.message);
    console.error('Stack:', error.stack);
    
    // Fallback: create simple placeholder icons
    console.log('\n⚠️  Creating placeholder icons as fallback...');
    await createPlaceholderIcons();
    process.exit(0);
  }
}

async function createPlaceholderIcons() {
  // Create a better-looking SVG-based PNG using sharp
  // Using AfroMoji branding colors and design
  const svg192 = `
    <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad192" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#F7931E;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="192" height="192" fill="#0A0A0A" rx="24"/>
      <circle cx="96" cy="96" r="70" fill="url(#grad192)"/>
      <text x="96" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#0A0A0A" text-anchor="middle">AM</text>
    </svg>
  `;

  // Generate 192x192
  await sharp(Buffer.from(svg192))
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDir, 'icon-192.png'));

  // Generate 512x512
  const svg512 = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad512" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B35;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#F7931E;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="#0A0A0A" rx="64"/>
      <circle cx="256" cy="256" r="186" fill="url(#grad512)"/>
      <text x="256" y="290" font-family="Arial, sans-serif" font-size="128" font-weight="bold" fill="#0A0A0A" text-anchor="middle">AM</text>
    </svg>
  `;

  await sharp(Buffer.from(svg512))
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'icon-512.png'));

  console.log('✅ Created placeholder icons with AfroMoji branding');
}

generateIcons();

