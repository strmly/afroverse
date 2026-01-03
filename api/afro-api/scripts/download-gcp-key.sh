#!/bin/bash

# Script to help download GCP service account key
# Usage: ./scripts/download-gcp-key.sh

PROJECT_ID="gen-lang-client-0213839796"
SERVICE_ACCOUNT="afroverse@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="./gcp-key.json"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Download GCP Service Account Key                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Service Account: ${SERVICE_ACCOUNT}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo ""
    echo "Option 1: Install gcloud CLI"
    echo "  Visit: https://cloud.google.com/sdk/docs/install"
    echo ""
    echo "Option 2: Download manually from GCP Console"
    echo "  1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=${PROJECT_ID}"
    echo "  2. Find service account: ${SERVICE_ACCOUNT}"
    echo "  3. Click on it > Keys > Add Key > Create new key"
    echo "  4. Choose JSON format"
    echo "  5. Save as: ${KEY_FILE}"
    echo ""
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo "⚠️  Not authenticated with gcloud"
    echo "Run: gcloud auth login"
    echo ""
    exit 1
fi

# Set project
echo "Setting project..."
gcloud config set project ${PROJECT_ID}

# Create key
echo "Creating service account key..."
gcloud iam service-accounts keys create ${KEY_FILE} \
  --iam-account=${SERVICE_ACCOUNT}

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Key downloaded successfully!"
    echo "   Saved to: ${KEY_FILE}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify .env has: GCS_KEY_FILE=./gcp-key.json"
    echo "  2. Run: npm run setup:buckets"
    echo "  3. Run: npm run test:buckets"
    echo ""
else
    echo ""
    echo "❌ Failed to create key"
    echo ""
    echo "Manual download:"
    echo "  1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=${PROJECT_ID}"
    echo "  2. Click: ${SERVICE_ACCOUNT}"
    echo "  3. Keys tab > Add Key > Create new key > JSON"
    echo "  4. Save as: ${KEY_FILE}"
    echo ""
    exit 1
fi



