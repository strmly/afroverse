#!/bin/bash

# Setup script for Twilio WhatsApp verification
# This script helps you configure Twilio OTP in your .env file

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Twilio WhatsApp OTP - Setup Script                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Twilio credentials
ACCOUNT_SID="AC6e415c4ec7b763967eda5ea684448794"
AUTH_TOKEN="f6ee3cb1e7dabdf3abd727dd644c52d5"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  
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
DISABLE_OTP=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Async Jobs (Vercel Cron)
CRON_SECRET=dev-secret
EOF
  
  echo "✅ .env file created"
fi

# Check if Twilio variables are already set
if grep -q "^TWILIO_ACCOUNT_SID=" .env; then
  echo "⚠️  Twilio credentials already configured in .env"
  echo "    Updating with new credentials..."
  
  # Update existing credentials
  sed -i.bak "s/^TWILIO_ACCOUNT_SID=.*/TWILIO_ACCOUNT_SID=${ACCOUNT_SID}/" .env
  sed -i.bak "s/^TWILIO_AUTH_TOKEN=.*/TWILIO_AUTH_TOKEN=${AUTH_TOKEN}/" .env
  rm .env.bak 2>/dev/null || true
  
  echo "✅ Twilio credentials updated"
else
  echo "📝 Adding Twilio credentials to .env..."
  
  # Add Twilio section
  cat >> .env << EOF

# Twilio WhatsApp OTP
TWILIO_ACCOUNT_SID=${ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${AUTH_TOKEN}
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=your-verify-service-sid
EOF
  
  echo "✅ Twilio credentials added to .env"
fi

# Ensure DISABLE_OTP is set to false
if grep -q "^DISABLE_OTP=true" .env; then
  sed -i.bak "s/^DISABLE_OTP=.*/DISABLE_OTP=false/" .env
  rm .env.bak 2>/dev/null || true
  echo "✅ Enabled OTP verification"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              Configuration Complete                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Twilio Account SID: ${ACCOUNT_SID}"
echo "🔐 Auth Token: f6ee3cb...52d5 (hidden)"
echo ""
echo "⚠️  IMPORTANT: Create a Twilio Verify Service"
echo ""
echo "To enable WhatsApp OTP, you need to create a Verify Service:"
echo ""
echo "1. Go to: https://console.twilio.com/us1/develop/verify/services"
echo "2. Click 'Create new Service'"
echo "3. Enter a name: 'AfroMoji OTP'"
echo "4. Click 'Create'"
echo "5. Copy the Service SID (starts with VA...)"
echo "6. Update .env with: TWILIO_VERIFY_SERVICE_SID=VA..."
echo ""
echo "Or run this command to create it automatically:"
echo ""
echo "  npm run twilio:create-service"
echo ""
echo "✅ Once configured, test with:"
echo ""
echo "  npm run test:twilio"
echo ""



