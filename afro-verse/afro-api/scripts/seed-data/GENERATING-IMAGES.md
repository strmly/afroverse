# Generating Actual AI Images for Seed Library

This guide explains how to generate 1000 real AI images using Nano Banana Pro for the AfroMoji seed library.

---

## Prerequisites

### 1. Nano Banana Pro API Key

You need a valid Nano Banana Pro API key. Get one from:
- https://nanobanana.com (or your AI generation service)

### 2. Environment Variables

Add to your `.env` file:

```bash
# Nano Banana Pro Configuration
NANO_BANANA_API_KEY=your_api_key_here
NANO_BANANA_API_URL=https://api.nanobanana.com/v1/generate
```

### 3. GCS Bucket Access

Ensure your Google Cloud Storage buckets are configured:
- `afromoji-private-gallery` (for watermarked images)
- `afromoji-raw-generations` (optional, for clean versions)

---

## Image Generation Process

### What Happens

1. **Generate Users**: Creates 1000 diverse SA user profiles
2. **Build Prompts**: Generates culturally-aware prompts with Style DNA
3. **Call Nano Banana Pro**: Generates images with hyper-realistic photography style
4. **Apply Watermarks**: Adds visible + invisible watermarks
5. **Upload to GCS**: Stores images in your cloud storage
6. **Create Posts**: Links images to users and creates feed posts

### Base Photography Style (Always Applied)

Every prompt automatically includes:

```
Hyper-realistic amateur photography, iPhone snapshot quality, 
natural lighting, casual everyday aesthetic, realistic details, 
background also in focus, tiny imperfections only from real life 
(not digital noise), no filters, no dramatic color grading, 
soft neutral tones, imperfect framing with subjects slightly off-center, 
real-life unedited vibe, clean high-resolution look, crisp edges, 
natural skin texture, realistic shadows and highlights, 
handheld composition, 23mm wide-angle feel, 1:1 aspect ratio
```

**Negative Prompt:**
```
No date/time stamp, no cinematic look, no vignette, no background blur, 
no symmetrical composition, no grain, no low resolution, no harsh artifacts
```

---

## Running the Script

### Option 1: Preview (No Changes)

See what will happen without making changes:

```bash
cd afro-api
npm run seed-sa:images
```

### Option 2: Full Generation

Generate all 1000 images:

```bash
npm run seed-sa:images -- --confirm
```

### Option 3: Custom Batch Size

Process fewer images at a time (reduces memory/API load):

```bash
npm run seed-sa:images -- --confirm --batch-size=5
```

Default batch size: 10 images in parallel

### Option 4: Resume After Interruption

If the script is interrupted, resume from last checkpoint:

```bash
npm run seed-sa:images -- --confirm --resume
```

---

## Expected Output

### Console Output

```
🌍 AfroMoji SA Seed Library - WITH REAL IMAGE GENERATION
══════════════════════════════════════════════════════════════════════
Target: 1000 users, 1000 posts with real images
Batch size: 10 images per batch

✅ Connected to database
✅ Nano Banana Pro generator initialized
✅ Found 5 tribes

👥 Step 1: Users...
   Progress: 1000/1000 users
✅ Users created

🎨 Step 2: Building prompts...
   Generated 1000 prompts

🖼️  Step 3: Generating images and creating posts...

   Batch 1: Processing prompts 1-10
   [1] Generating: Zulu-inspired...
   [1] ✅ Image generated and uploaded
   [1] ✅ Post created: 6959...

   Batch complete. Total: 10/1000 images generated
   Errors: 0, Failed indices: 0

   ... (continues for all batches)

✅ All batches complete

══════════════════════════════════════════════════════════════════════
✅ Seeding Complete!
══════════════════════════════════════════════════════════════════════
Users created:       1000
Images generated:    995
Posts created:       995
Errors:              5
Failed indices:      5
Duration:            2847s (47m)
══════════════════════════════════════════════════════════════════════
```

### Progress Tracking

The script saves progress to `seed-progress.json` after each batch:

```json
{
  "usersCreated": 1000,
  "imagesGenerated": 450,
  "postsCreated": 450,
  "errors": 2,
  "lastProcessedIndex": 449,
  "failedIndices": [234, 389],
  "startTime": "2026-01-03T15:30:00.000Z",
  "lastUpdated": "2026-01-03T16:15:00.000Z"
}
```

If interrupted, run with `--resume` to continue.

---

## Performance & Timing

### Expected Duration

- **Full run**: 30-60 minutes
- **Per image**: 2-5 seconds (API dependent)
- **Batch of 10**: 20-50 seconds
- **Rate limiting**: 2-second pause between batches

### API Costs

Estimate costs based on your Nano Banana Pro pricing:
- 1000 images × your per-image cost
- Check your API provider's pricing page

### Resource Usage

- **Memory**: ~500MB for processing
- **Network**: ~1-2GB upload (images to GCS)
- **Disk**: ~2-3GB (temporary image processing)

---

## Troubleshooting

### "NANO_BANANA_API_KEY not configured"

**Fix**: Add `NANO_BANANA_API_KEY` to your `.env` file

### "Failed to upload image"

**Check**:
1. GCS credentials are configured
2. Bucket names are correct
3. Service account has write permissions

### "API rate limit exceeded"

**Fix**:
1. Reduce batch size: `--batch-size=5`
2. Add longer delays between batches (edit script)
3. Check your API plan limits

### Script hangs on a specific image

**Causes**:
- Complex prompt causing long generation time
- API timeout
- Network issues

**Fix**:
1. Wait 2 minutes, script will retry
2. After 3 retries, it will skip and continue
3. Re-run failed indices later

### How to retry failed images

Failed indices are saved in progress file. To retry:

1. Note the failed indices from output
2. Edit `seed-sa-with-images.ts` to only process those indices
3. Re-run with `--confirm`

Or manually create a retry script for specific indices.

---

## Output Structure

### Database Records

**Users:**
```javascript
{
  username: "thabo_nkosi",
  displayName: "Thabo Nkosi",
  phoneNumber: "+27711234567",
  tribeId: ObjectId("..."),
  bio: "Gauteng | Creative | Fashion",
  counters: { posts: 1, ... }
}
```

**Generations:**
```javascript
{
  userId: ObjectId("..."),
  prompt: "South African persona with Zulu-inspired...",
  negativePrompt: "no caricature, no stereotypes...",
  status: "complete",
  versions: [{
    versionId: "...",
    imagePath: "generations/.../v1_..._wm.webp",
    thumbPath: "generations/.../v1_..._thumb_wm.webp",
    dimensions: { width: 1024, height: 1024 }
  }],
  metadata: {
    model: "nano-banana-pro",
    seed: 123456,
    seedId: "SA_0001",
    culturalTags: ["Zulu-inspired", "Nguni"],
    languageTags: ["isiZulu", "en"],
    styleDNA: {
      basePalette: ["#000000", "#FFFFFF", "#C41E3A", "#0047AB"],
      patternMotifs: ["beadwork", "geometric patterns"],
      ...
    }
  }
}
```

**Posts:**
```javascript
{
  userId: ObjectId("..."),
  generationId: ObjectId("..."),
  media: {
    imagePath: "generations/.../v1_..._wm.webp",
    thumbPath: "generations/.../v1_..._thumb_wm.webp",
    aspect: "1:1"
  },
  caption: "Zulu-inspired ✨",
  visibility: "public",
  counts: { respects: 12, shares: 3, remixes: 1 },
  tags: ["Zulu-inspired", "Nguni", "isiZulu"],
  metadata: {
    seedPost: true,
    seedId: "SA_0001",
    clusterId: "ZULU_INSPIRED",
    styleDNA: { ... }
  }
}
```

### GCS File Structure

```
afromoji-private-gallery/
└── generations/
    └── {userId}/
        └── {generationId}/
            ├── v1_{timestamp}_wm.webp           (watermarked full)
            ├── v1_{timestamp}_thumb_wm.webp     (watermarked thumb)
            └── v1_{timestamp}_clean.webp        (optional clean)
```

---

## Verification

### Check Generated Images

```bash
# Count posts
mongo
use afromoji
db.posts.countDocuments({ "metadata.seedPost": true })

# Sample a post
db.posts.findOne({ "metadata.seedPost": true })

# Check GCS
gsutil ls gs://afromoji-private-gallery/generations/ | wc -l
```

### Test Feed

1. Go to http://localhost:3000/feed
2. Should see seed posts in the feed
3. Click any post → "Try This Style" should work

### Test Profile

1. Check any seeded user's profile
2. Should see their generated post
3. Style DNA should be visible in post metadata

---

## Best Practices

### 1. Start Small

Test with a small batch first:

```bash
# Edit script to set TARGET_POSTS = 10
npm run seed-sa:images -- --confirm --batch-size=2
```

### 2. Monitor API Usage

- Check your API dashboard during generation
- Verify costs are as expected
- Watch for rate limit warnings

### 3. Backup Progress

```bash
# Copy progress file
cp seed-progress.json seed-progress.backup.json
```

### 4. Quality Check

After first 50 images:
1. Review generated images in GCS
2. Check cultural accuracy
3. Verify watermarks are applied
4. Adjust prompts if needed

---

## Production Deployment

For production seeding:

### 1. Run on a server

Don't run on your laptop:
- Use a cloud VM
- Or scheduled serverless function
- Stable internet required

### 2. Stagger generation

Don't generate all 1000 at once:
- Day 1: 300 images
- Day 2: 300 images
- Day 3: 400 images

### 3. Manual review

Review a sample (10-20 images per cluster) before publishing to feed.

### 4. Cultural consultation

Have cultural advisors review images from sensitive clusters before public launch.

---

## Next Steps After Seeding

1. ✅ **Verify image quality**
2. ✅ **Test "Try This Style"** with seed posts
3. ✅ **Configure feed algorithms** to surface seed posts
4. ✅ **Monitor user engagement** with seed content
5. ✅ **A/B test** different clusters
6. ✅ **Iterate prompts** based on feedback

---

## Support

For issues:
1. Check console logs for specific errors
2. Review `seed-progress.json` for failed indices
3. Check GCS bucket permissions
4. Verify API key and credits
5. Test API endpoint manually with curl

**Built to celebrate South Africa's cultural diversity** 🇿🇦

