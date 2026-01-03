#!/bin/bash

# Setup script for Gemini Nano Banana Pro integration
# This script helps you configure the GEMINI_API_KEY in your .env file

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Gemini Nano Banana Pro - Setup Script               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from template..."
  
  cat > .env << 'EOF'
# Node Environment
NODE_ENV=development

# Server Port
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/afromoji

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# Google Cloud Storage
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-gcp-project-id

# AI Providers
GEMINI_API_KEY=AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE

# Security
DISABLE_OTP=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Async Jobs (Vercel Cron)
CRON_SECRET=dev-secret
EOF
  
  echo "✅ .env file created with default values"
else
  echo "✅ .env file already exists"
  
  # Check if GEMINI_API_KEY is set
  if grep -q "^GEMINI_API_KEY=" .env; then
    echo "✅ GEMINI_API_KEY is already configured"
  else
    echo "⚠️  GEMINI_API_KEY not found in .env file"
    echo "📝 Adding GEMINI_API_KEY to .env file..."
    echo "" >> .env
    echo "# AI Providers" >> .env
    echo "GEMINI_API_KEY=AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE" >> .env
    echo "✅ GEMINI_API_KEY added to .env file"
  fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                  Configuration Info                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Model Information:"
echo "   - Nano Banana: gemini-2.5-flash-image (fast, standard quality)"
echo "   - Nano Banana Pro: gemini-3-pro-image-preview (high quality, advanced reasoning)"
echo ""
echo "🔑 API Key: AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE"
echo ""
echo "📖 Documentation:"
echo "   https://ai.google.dev/gemini-api/docs/nano-banana"
echo ""
echo "✅ Setup complete! You can now test the integration:"
echo ""
echo "   npm run test:gemini"
echo ""



