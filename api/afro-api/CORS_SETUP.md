# CORS Setup for GCS Bucket

The GCS bucket needs CORS configuration to allow browser uploads.

## Option 1: Using Google Cloud Console (Easiest)

1. Go to [Google Cloud Console - Storage](https://console.cloud.google.com/storage/browser)
2. Select your project: `gen-lang-client-0213839796`
3. Find or create the bucket: `afromoji-dev`
4. Click on the bucket name
5. Go to the "Permissions" tab
6. Click "Edit CORS configuration"
7. Add this JSON:

```json
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001", "*"],
    "method": ["GET", "HEAD", "PUT", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "x-goog-resumable",
      "x-goog-content-length-range"
    ],
    "maxAgeSeconds": 3600
  }
]
```

8. Click "Save"

## Option 2: Using gsutil (Command Line)

If you have `gsutil` installed:

```bash
# Create a CORS config file
cat > cors.json << 'EOF'
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001", "*"],
    "method": ["GET", "HEAD", "PUT", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Content-Length",
      "x-goog-resumable",
      "x-goog-content-length-range"
    ],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS configuration
gsutil cors set cors.json gs://afromoji-dev

# Clean up
rm cors.json
```

## Option 3: Create Bucket and Configure CORS

If the bucket doesn't exist, create it first:

```bash
# Create bucket
gsutil mb -p gen-lang-client-0213839796 -l US gs://afromoji-dev

# Then configure CORS (see Option 2)
```

## Option 4: Using the Script

Once the bucket exists, run:

```bash
cd afro-api
npx ts-node scripts/fix-cors-uploads.ts
```

## Verify CORS Configuration

```bash
gsutil cors get gs://afromoji-dev
```



