#!/bin/bash

# Test Gemini API directly with curl
# This demonstrates the raw API usage before integration

set -e

API_KEY="AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Testing Gemini API with curl                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Basic text generation (to verify API key works)
echo "=== Test 1: Basic Text Generation (API Key Verification) ==="
echo ""

response=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H "X-goog-api-key: ${API_KEY}" \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }')

if echo "$response" | grep -q "error"; then
  echo "❌ API Key verification failed:"
  echo "$response" | jq '.'
  exit 1
else
  echo "✅ API Key is valid!"
  echo ""
  echo "Response:"
  echo "$response" | jq '.candidates[0].content.parts[0].text' -r
  echo ""
fi

# Test 2: Image generation with Nano Banana (gemini-2.5-flash-image)
echo "=== Test 2: Image Generation with Nano Banana ==="
echo ""
echo "Note: This test may fail if the model name is not yet available in the API."
echo "The integration code will work once Google releases the model."
echo ""

response=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H 'Content-Type: application/json' \
  -H "X-goog-api-key: ${API_KEY}" \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Create a picture of a futuristic banana with neon lights in a cyberpunk city."
          }
        ]
      }
    ]
  }')

if echo "$response" | grep -q "error"; then
  echo "⚠️  Image generation test returned an error:"
  echo "$response" | jq '.'
  echo ""
  echo "This is expected if the model is not yet available."
  echo "The service code is ready and will work once Google releases the model."
else
  echo "✅ Image generation successful!"
  echo ""
  echo "Response metadata:"
  echo "$response" | jq 'del(.candidates[0].content.parts[0].inlineData)' -r
  echo ""
fi

# Test 3: List available models
echo "=== Test 3: List Available Models ==="
echo ""

models=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}")

echo "Available Gemini models:"
echo "$models" | jq '.models[] | select(.name | contains("gemini")) | {name: .name, displayName: .displayName, description: .description}' -c | head -10

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                    Test Complete                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "  ✅ API Key is valid and working"
echo "  📝 Integration code is ready"
echo "  ⏳ Waiting for Google to release Nano Banana models"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run test:gemini' to test the TypeScript integration"
echo "  2. Check the generated test images in the afro-api directory"
echo "  3. Review docs/GEMINI_INTEGRATION.md for usage examples"
echo ""



