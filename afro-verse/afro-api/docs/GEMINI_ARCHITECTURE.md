# Gemini Nano Banana Pro - Architecture

This document describes how the Gemini service integrates into the AfroMoji architecture.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AfroMoji Frontend                        │
│                      (afro-web - Next.js)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                        AfroMoji API                             │
│                    (afro-api - Express)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Generate Controller                        │  │
│  │         (src/controllers/generate.controller.ts)        │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │           Generation Service                            │  │
│  │        (src/services/generation.service.ts)             │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │          Generation Pipeline                            │  │
│  │        (src/ai/generationPipeline.ts)                   │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │  │
│  │  │  OpenAI    │  │ Replicate  │  │    FAL     │       │  │
│  │  │  Provider  │  │  Provider  │  │  Provider  │       │  │
│  │  └────────────┘  └────────────┘  └────────────┘       │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │         Gemini Service (NEW!)                  │    │  │
│  │  │    (src/services/gemini.service.ts)            │    │  │
│  │  │                                                 │    │  │
│  │  │  • generateImage()                             │    │  │
│  │  │  • refineImage()                               │    │  │
│  │  │  • buildUserPrompt()                           │    │  │
│  │  │  • isGeminiConfigured()                        │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Google Gemini API                             │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────────┐    │
│  │   Nano Banana        │     │   Nano Banana Pro        │    │
│  │ gemini-2.5-flash-    │     │ gemini-3-pro-image-      │    │
│  │      image           │     │      preview             │    │
│  │                      │     │                          │    │
│  │  • Fast              │     │  • High Quality          │    │
│  │  • Standard Quality  │     │  • Advanced Reasoning    │    │
│  │  • Lower Cost        │     │  • Better Faces          │    │
│  └──────────────────────┘     └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Image Generation Request

```
User Request
    │
    ├─> Frontend (afro-web)
    │       │
    │       └─> POST /api/generate
    │
    ├─> API Controller (generate.controller.ts)
    │       │
    │       ├─> Validate input
    │       ├─> Check authentication
    │       └─> Extract parameters
    │
    ├─> Generation Service (generation.service.ts)
    │       │
    │       ├─> Create Generation record
    │       ├─> Load user selfies
    │       └─> Queue generation job
    │
    ├─> Generation Pipeline (generationPipeline.ts)
    │       │
    │       ├─> Select provider (Gemini)
    │       ├─> Build prompt
    │       └─> Call provider
    │
    ├─> Gemini Service (gemini.service.ts)
    │       │
    │       ├─> Select model (Pro or Standard)
    │       ├─> Build system instruction
    │       ├─> Prepare image data
    │       └─> Call Gemini API
    │
    ├─> Google Gemini API
    │       │
    │       ├─> Process request
    │       ├─> Generate image
    │       ├─> Apply safety filters
    │       └─> Return image data
    │
    └─> Response Flow (reverse)
            │
            ├─> Gemini Service receives image
            ├─> Pipeline processes result
            ├─> Service saves to storage
            ├─> Generation record updated
            └─> Client receives URL
```

## Component Details

### Gemini Service (`src/services/gemini.service.ts`)

**Responsibilities:**
- Interface with Google Gemini API
- Model selection (Nano Banana vs Pro)
- Prompt building and system instructions
- Image encoding/decoding
- Error handling and classification

**Key Functions:**

```typescript
// Generate new image
generateImage(input: GenerationInput): Promise<GenerationOutput>

// Refine existing image
refineImage(input: RefineInput): Promise<GenerationOutput>

// Build prompt from preset
buildUserPrompt(params): string

// Check configuration
isGeminiConfigured(): boolean
```

**Models:**

```typescript
const MODEL_NANO_BANANA = 'gemini-2.5-flash-image';
const MODEL_NANO_BANANA_PRO = 'gemini-3-pro-image-preview';
```

### Generation Pipeline (`src/ai/generationPipeline.ts`)

**Integration Points:**

```typescript
import { generateImage, isGeminiConfigured } from '../services/gemini.service';

// Check if Gemini is available
if (isGeminiConfigured()) {
  // Use Gemini as provider
  const result = await generateImage({
    prompt: buildPrompt(request),
    quality: request.quality,
    aspectRatio: request.aspectRatio,
    images: selfieBuffers,
  });
}
```

### Generation Service (`src/services/generation.service.ts`)

**Workflow:**

1. Receive generation request
2. Create Generation record in MongoDB
3. Load user selfies from storage
4. Call generation pipeline
5. Save result to Google Cloud Storage
6. Update Generation record with version
7. Return generation ID to client

### Database Schema

**Generation Model:**

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  status: 'queued' | 'running' | 'succeeded' | 'failed',
  source: {
    selfieIds: [ObjectId],
    mode: 'prompt' | 'remix'
  },
  style: {
    prompt: string,
    parameters: {
      aspect: '1:1' | '9:16',
      quality: 'standard' | 'high'
    }
  },
  provider: {
    name: 'gemini-nano-banana' | 'gemini-nano-banana-pro',
    model: string,
    requestIds: [string]
  },
  versions: [{
    versionId: string,
    imagePath: string,
    thumbPath: string,
    createdAt: Date
  }],
  createdAt: Date,
  completedAt: Date
}
```

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE

# Optional (defaults shown)
NODE_ENV=development
PORT=3001
```

### Model Selection Logic

```typescript
function selectModel(quality: 'standard' | 'high'): string {
  return quality === 'high' 
    ? MODEL_NANO_BANANA_PRO 
    : MODEL_NANO_BANANA;
}
```

### Quality Settings

| Quality | Model | Use Case | Speed | Cost |
|---------|-------|----------|-------|------|
| `standard` | Nano Banana | Quick previews | Fast | Low |
| `high` | Nano Banana Pro | Professional assets | Moderate | Higher |

## Error Handling

### Error Flow

```
Gemini API Error
    │
    ├─> Gemini Service catches error
    │       │
    │       ├─> Classify error type
    │       │   ├─> Content blocked → 'BLOCKED'
    │       │   ├─> Rate limited → 'RATE_LIMITED'
    │       │   └─> Other → Original error
    │       │
    │       └─> Throw classified error
    │
    ├─> Generation Pipeline catches error
    │       │
    │       ├─> Log error details
    │       ├─> Try fallback provider (if configured)
    │       └─> Return error to service
    │
    ├─> Generation Service handles error
    │       │
    │       ├─> Update Generation status to 'failed'
    │       ├─> Store error message
    │       └─> Return error to controller
    │
    └─> Controller returns error response
            │
            └─> Client receives error
```

### Error Types

```typescript
// Content blocked by safety filters
if (error.message === 'BLOCKED') {
  // Prompt violated safety policies
}

// Rate limit exceeded
if (error.message === 'RATE_LIMITED') {
  // Too many requests
}

// API not configured
if (error.message === 'Gemini API not configured') {
  // GEMINI_API_KEY not set
}
```

## Safety & Moderation

### System Instruction

```typescript
const systemInstruction = `
You are an AI that generates high-quality portrait images with:

IDENTITY PRESERVATION:
- Preserve face identity and features
- Maintain accurate skin tone
- Keep realistic proportions

CULTURAL RESPECT:
- Authentic cultural representations
- Avoid stereotypes
- Celebrate diversity with dignity

SAFETY:
- No nudity or explicit content
- No hate speech or violence
- No inappropriate content with minors
- No illegal activities

OUTPUT QUALITY:
- Professional lighting
- Centered single subject
- Consistent style
- Sharp details
`;
```

### Content Filtering

```
User Prompt
    │
    ├─> Gemini Service
    │       │
    │       └─> Add system instruction
    │
    ├─> Gemini API
    │       │
    │       ├─> Apply safety filters
    │       ├─> Check prompt
    │       ├─> Generate image
    │       └─> Check output
    │
    └─> Response
            │
            ├─> If blocked: Error with reason
            └─> If passed: Image data
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache generated images
const cacheKey = `generation:${generationId}:${versionId}`;
await redis.set(cacheKey, imageBuffer, 'EX', 3600);

// Retrieve from cache
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

### Request Queuing

```typescript
// Use job queue for async generation
await jobQueue.add('generate-image', {
  generationId,
  userId,
  prompt,
  quality,
});
```

### Rate Limiting

```typescript
// Implement rate limiting per user
const limit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  keyGenerator: (req) => req.user.id,
});

router.post('/generate', limit, generateController);
```

## Monitoring

### Metrics to Track

```typescript
// Generation metrics
{
  totalGenerations: number,
  successRate: number,
  averageLatency: number,
  errorRate: number,
  blockedRate: number,
}

// Provider metrics
{
  provider: 'gemini-nano-banana' | 'gemini-nano-banana-pro',
  requests: number,
  successes: number,
  failures: number,
  averageCost: number,
}

// User metrics
{
  userId: ObjectId,
  generationsToday: number,
  generationsThisMonth: number,
  lastGenerationAt: Date,
}
```

### Logging

```typescript
import { logger } from '../utils/logger';

// Log generation start
logger.info('Starting generation', {
  generationId,
  userId,
  provider: 'gemini',
  quality,
});

// Log generation success
logger.info('Generation succeeded', {
  generationId,
  latency: endTime - startTime,
  imageSize: imageData.length,
});

// Log generation error
logger.error('Generation failed', {
  generationId,
  error: error.message,
  provider: 'gemini',
});
```

## Security Considerations

### API Key Protection

```typescript
// Never expose API key in client code
// Always use environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Never log API key
logger.info('Using Gemini API', {
  keyLength: apiKey?.length, // Log length only
});
```

### Input Validation

```typescript
// Validate user input
const schema = Joi.object({
  prompt: Joi.string().max(1000).required(),
  quality: Joi.string().valid('standard', 'high'),
  aspectRatio: Joi.string().valid('1:1', '9:16'),
});

const { error, value } = schema.validate(input);
if (error) throw new ValidationError(error);
```

### Output Sanitization

```typescript
// Sanitize generated content
const sanitized = {
  imageData: result.imageData, // Binary data
  mimeType: result.mimeType,
  // Don't expose internal IDs or metadata
};
```

## Scalability

### Horizontal Scaling

```
Load Balancer
    │
    ├─> API Instance 1 ──┐
    ├─> API Instance 2 ──┼─> Gemini API
    └─> API Instance 3 ──┘
```

### Async Processing

```typescript
// Queue generation jobs
await jobQueue.add('generate', {
  generationId,
  userId,
  params,
});

// Process in worker
worker.process('generate', async (job) => {
  const result = await generateImage(job.data.params);
  await saveResult(job.data.generationId, result);
});
```

## Testing

### Unit Tests

```typescript
describe('Gemini Service', () => {
  it('should generate image', async () => {
    const result = await generateImage({
      prompt: 'test',
      quality: 'standard',
      aspectRatio: '1:1',
    });
    expect(result.imageData).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Generation Pipeline', () => {
  it('should use Gemini when configured', async () => {
    const result = await generateWithPipeline({
      userId,
      prompt: 'test',
      provider: 'gemini',
    });
    expect(result.provider).toBe('gemini');
  });
});
```

## Deployment

### Production Checklist

- [ ] Set production API key
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Enable error tracking
- [ ] Configure caching
- [ ] Set up job queue
- [ ] Test failover
- [ ] Document runbook

---

**For implementation details, see:**
- [Integration Guide](GEMINI_INTEGRATION.md)
- [Setup Guide](../../GEMINI_SETUP_GUIDE.md)
- [Quick Reference](../GEMINI_QUICK_REFERENCE.md)



