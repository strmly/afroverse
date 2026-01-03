# Gemini Nano Banana Pro - Quick Reference

## 🚀 Quick Start

```bash
# 1. Setup
npm run setup:gemini

# 2. Test
npm run test:gemini

# 3. Check output images in afro-api directory
```

## 📋 Models

| Model | ID | Use Case | Speed | Quality |
|-------|-----|----------|-------|---------|
| Nano Banana | `gemini-2.5-flash-image` | High-volume, quick previews | ⚡⚡⚡ | ⭐⭐⭐ |
| Nano Banana Pro | `gemini-3-pro-image-preview` | Professional assets, portraits | ⚡⚡ | ⭐⭐⭐⭐⭐ |

## 💻 Code Examples

### Basic Generation

```typescript
import { generateImage } from './services/gemini.service';

const result = await generateImage({
  prompt: 'Afrofuturist portrait with vibrant colors',
  quality: 'standard', // or 'high'
  aspectRatio: '1:1', // or '9:16'
});

fs.writeFileSync('output.png', result.imageData);
```

### With Reference Image (Face Preservation)

```typescript
const selfie = fs.readFileSync('selfie.jpg');

const result = await generateImage({
  prompt: 'Transform into an Afrofuturist warrior',
  quality: 'high', // Pro recommended for faces
  aspectRatio: '1:1',
  images: [selfie],
});
```

### Using Preset Styles

```typescript
import { buildUserPrompt, generateImage } from './services/gemini.service';

const prompt = buildUserPrompt({
  presetId: 'afrofuturism', // or 'royal', 'street', 'vintage', 'warrior'
  userPrompt: 'wearing a golden crown',
  aspectRatio: '1:1',
});

const result = await generateImage({
  prompt,
  quality: 'high',
  aspectRatio: '1:1',
});
```

### Image Refinement

```typescript
import { refineImage } from './services/gemini.service';

const baseImage = fs.readFileSync('base.png');

const result = await refineImage({
  baseImage,
  instruction: 'Add a golden crown',
  quality: 'high',
  aspectRatio: '1:1',
  prompt: '', // Required but not used
});
```

### Custom System Instruction

```typescript
const result = await generateImage({
  prompt: 'A golden crown with African patterns',
  quality: 'high',
  aspectRatio: '1:1',
  systemInstruction: 'Expert at creating culturally authentic African art...',
});
```

## 🎨 Preset Styles

```typescript
const presets = {
  'afrofuturism': 'Vibrant colors, geometric patterns, futuristic',
  'royal': 'Traditional royal attire, crowns, jewelry',
  'street': 'Contemporary urban fashion',
  'vintage': 'Classic photography aesthetics',
  'warrior': 'Traditional warrior attire',
};
```

## 🛡️ Error Handling

```typescript
try {
  const result = await generateImage({ prompt: 'test' });
} catch (error) {
  if (error.message === 'BLOCKED') {
    // Content blocked by safety filters
  } else if (error.message === 'RATE_LIMITED') {
    // Rate limit exceeded
  } else if (error.message === 'Gemini API not configured') {
    // API key not set
  }
}
```

## 📊 API Response

```typescript
interface GenerationOutput {
  imageData: Buffer;    // PNG image data
  mimeType: string;     // 'image/png'
  requestId?: string;   // Optional tracking ID
}
```

## 🔑 Configuration

```bash
# .env file
GEMINI_API_KEY=AIzaSyBK2X8u-FoqJeNpWNJztuP_SSuWsnGTbEE
```

## 📏 Aspect Ratios

- `'1:1'` - Square (profile pictures, avatars)
- `'9:16'` - Portrait (full-body shots, stories)

## ⚙️ Quality Settings

- `'standard'` - Fast, lower cost, good quality (Nano Banana)
- `'high'` - Slower, higher cost, excellent quality (Nano Banana Pro)

## 💡 Best Practices

✅ **DO:**
- Use `quality: 'high'` for portraits with face preservation
- Provide clear, well-lit reference images
- Use detailed, specific prompts
- Handle errors gracefully
- Cache generated images

❌ **DON'T:**
- Use standard quality for complex face preservation
- Provide blurry or dark reference images
- Use vague prompts
- Ignore error handling
- Regenerate the same content repeatedly

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| "API not configured" | Set `GEMINI_API_KEY` in `.env` |
| "Content blocked" | Rephrase prompt, remove sensitive content |
| "Rate limited" | Implement backoff, reduce frequency |
| Poor face preservation | Use `quality: 'high'`, better reference images |

## 📚 Documentation

- [Full Integration Guide](docs/GEMINI_INTEGRATION.md)
- [Setup Guide](../GEMINI_SETUP_GUIDE.md)
- [Usage Examples](examples/gemini-usage.ts)
- [Official Docs](https://ai.google.dev/gemini-api/docs/nano-banana)

## 🧪 Testing

```bash
# Run all tests
npm run test:gemini

# Test with curl
bash scripts/test-gemini-curl.sh

# Run examples
ts-node examples/gemini-usage.ts
```

## 📦 Package

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.3"
  }
}
```

## 🌐 API Endpoint (Direct)

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H 'Content-Type: application/json' \
  -H 'X-goog-api-key: YOUR_API_KEY' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Create a futuristic banana"
      }]
    }]
  }'
```

## 🎯 Common Use Cases

1. **Profile Pictures**: `quality: 'high'`, `aspectRatio: '1:1'`, with selfie
2. **Story Content**: `quality: 'standard'`, `aspectRatio: '9:16'`
3. **High-Quality Assets**: `quality: 'high'`, custom system instruction
4. **Quick Previews**: `quality: 'standard'`, simple prompts
5. **Batch Generation**: Multiple `generateImage()` calls with `Promise.all()`

---

**Need more help?** Check the [full documentation](docs/GEMINI_INTEGRATION.md) or [setup guide](../GEMINI_SETUP_GUIDE.md).



