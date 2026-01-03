# AfroMoji Backend API

Production-ready backend API for AfroMoji with MongoDB data model implementation.

## Table of Contents

- [Quick Start](#quick-start)
- [Data Model](#data-model)
- [API Structure](#api-structure)
- [Environment Setup](#environment-setup)
- [Database Operations](#database-operations)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Setup database (creates indexes, seeds tribes)
npm run setup:db

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev                   # Start development server with hot reload
npm run build                 # Build for production
npm run start                 # Start production server
npm run setup:db              # Initialize database
npm run setup:gemini          # Setup Gemini Nano Banana Pro
npm run setup:twilio          # Setup Twilio WhatsApp OTP
npm run check:health          # Check database health
npm run test                  # Run tests
npm run test:gemini           # Test Gemini image generation
npm run test:twilio           # Test Twilio OTP
npm run twilio:create-service # Create Twilio Verify Service
npm run lint                  # Run linter
```

---

## Data Model

### Core Philosophy

1. **Identity is immutable history** - Never overwrite creative output
2. **Posts reference generations, not files** - Storage paths can change
3. **Tribe is a first-class index** - Tribe filtering is optimized
4. **Counters are denormalized** - Fast reads, atomic writes

### Collections

#### 1. Users (`users`)
- Authentication identity
- Tribe membership (required after onboarding)
- Public profile with avatar
- Denormalized counters (posts, respects received)

**Indexes**: `phoneE164`, `username`, `tribeId`, `status.banned`

#### 2. Tribes (`tribes`)
- Cultural homes (5 default tribes)
- Visual identity (colors, icons)
- Denormalized stats (members, posts)

**Indexes**: `slug`

#### 3. UserSelfies (`userselfies`)
- Raw biometric inputs (never public)
- Soft delete support
- Referenced by generations

**Indexes**: `userId + createdAt`, `status`

#### 4. Generations (`generations`)
- Creation sessions
- **Append-only versions** (never overwrite)
- Style configuration and provider metadata
- Status tracking (queued → running → succeeded/failed)

**Indexes**: `userId + createdAt`, `status`

#### 5. Posts (`posts`)
- Public content (feed items)
- References generation + version (immutable)
- Denormalized counters and ranking scores
- Soft delete support

**Indexes**: `tribeId + createdAt`, `visibility + createdAt`, `userId + createdAt`, `status`, `rank.hotScore`

#### 6. Respects (`respects`)
- Likes with duplicate prevention
- Atomic counter updates via transactions
- Reversible (hard delete)

**Indexes**: `postId + userId` (unique), `userId + createdAt`

#### 7. OTPSessions (`otpsessions`)
- WhatsApp OTP lifecycle
- Auto-expire via TTL index
- Rate limiting support

**Indexes**: `phoneE164 + createdAt`, `expiresAt` (TTL)

### Transaction Boundaries

Critical operations use MongoDB transactions:

```typescript
import { 
  addRespectWithCounters,
  removeRespectWithCounters,
  createPostWithCounters,
  joinTribeWithCounters 
} from './utils/transactions';

// Atomic respect + counter update
await addRespectWithCounters(postId, userId);

// Atomic post creation + counter updates
await createPostWithCounters({ ...postData });
```

### Soft vs Hard Deletes

| Collection   | Strategy     |
| ------------ | ------------ |
| users        | Soft delete  |
| posts        | Soft delete  |
| userselfies  | Soft delete  |
| generations  | Never delete |
| respects     | Hard delete  |
| otpsessions  | TTL delete   |

---

## API Structure

```
src/
├── models/               # Mongoose models
│   ├── User.ts
│   ├── Tribe.ts
│   ├── UserSelfie.ts
│   ├── Generation.ts
│   ├── Post.ts
│   ├── Respect.ts
│   ├── OTPSession.ts
│   └── index.ts
├── controllers/          # Route controllers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── generate.controller.ts
│   ├── post.controller.ts
│   ├── feed.controller.ts
│   └── tribe.controller.ts
├── services/            # Business logic
│   ├── auth.service.ts
│   ├── generation.service.ts
│   ├── gemini.service.ts
│   ├── feed.service.ts
│   ├── tribe.service.ts
│   └── moderation.service.ts
├── middleware/          # Express middleware
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── rateLimit.middleware.ts
│   └── upload.middleware.ts
├── routes/              # API routes
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── generate.routes.ts
│   ├── post.routes.ts
│   ├── feed.routes.ts
│   └── tribe.routes.ts
├── utils/               # Utilities
│   ├── transactions.ts  # Transaction helpers
│   ├── validation.ts    # Data validation
│   ├── dbInit.ts       # Database initialization
│   ├── logger.ts       # Winston logger
│   ├── id.ts           # ID generation
│   └── sanitize.ts     # Input sanitization
├── config/              # Configuration
│   ├── db.ts           # Database connection
│   ├── env.ts          # Environment variables
│   └── storage.ts      # Google Cloud Storage
├── ai/                  # AI generation
│   ├── generationPipeline.ts
│   ├── promptTemplates.ts
│   └── providers/
│       ├── openai.ts
│       ├── replicate.ts
│       ├── fal.ts
│       └── gemini.ts (via services/gemini.service.ts)
├── jobs/                # Background jobs
│   └── cleanupOldGenerations.ts
├── scripts/             # Setup scripts
│   ├── setupDatabase.ts
│   └── checkHealth.ts
├── tests/               # Test suite
│   └── models.test.ts
├── app.ts              # Express app
└── server.ts           # Server entry point
```

---

## Environment Setup

### Required Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/afromoji

# Authentication
JWT_SECRET=your-secret-key

# Storage
GCS_BUCKET_NAME=afromoji-storage
GCS_PROJECT_ID=your-gcp-project
```

### Optional Variables

```env
# WhatsApp OTP
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# AI Providers
OPENAI_API_KEY=...
REPLICATE_API_KEY=...
FAL_API_KEY=...
GEMINI_API_KEY=...
```

See `.env.example` for full configuration options.

---

## Database Operations

### Initialize Database

```bash
# Create indexes, seed tribes, validate schema
npm run setup:db
```

This will:
1. Create all MongoDB indexes
2. Seed 5 default tribes:
   - Wakandan Lineage
   - Lagos Lions
   - Nile Royals
   - Zulu Nation
   - Diaspora Rising
3. Validate database connection
4. Display collection statistics

### Check Health

```bash
npm run check:health
```

Displays:
- Connection status
- Collection counts
- Database statistics

### Manual Operations

```typescript
import { initializeDatabase, getDatabaseStats } from './utils/dbInit';

// Initialize
await initializeDatabase();

// Get stats
const stats = await getDatabaseStats();
console.log(stats);
```

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Coverage

- Model validation
- Schema invariants
- Index enforcement
- Transaction atomicity
- Soft delete behavior
- OTP verification flow

---

## Common Operations

### Create User with Tribe

```typescript
import { User, Tribe } from './models';

const tribe = await Tribe.findOne({ slug: 'lagos-lions' });
const user = await User.create({
  phoneE164: '+27821234567',
  phoneVerified: true,
  auth: {
    provider: 'whatsapp',
    lastVerifiedAt: new Date(),
  },
  username: 'cool_user',
  displayName: 'Cool User',
  tribeId: tribe._id,
});
```

### Create Generation with Versions

```typescript
import { Generation } from './models';

const generation = await Generation.create({
  userId: user._id,
  source: {
    selfieIds: [selfie._id],
    mode: 'prompt',
  },
  style: {
    prompt: 'Afrofuturist warrior',
    parameters: { aspect: '1:1', quality: 'high' },
  },
  provider: {
    name: 'nano-banana-pro',
    model: 'flux-schnell',
    requestIds: [],
  },
});

// Add version when generation completes
await generation.addVersion({
  imagePath: 'generations/abc123.jpg',
  thumbPath: 'generations/abc123_thumb.jpg',
});

await generation.markSucceeded();
```

### Create Post with Counters

```typescript
import { createPostWithCounters } from './utils/transactions';

const post = await createPostWithCounters({
  userId: user._id,
  tribeId: user.tribeId,
  generationId: generation._id,
  versionId: 'v1',
  caption: 'My awesome creation!',
  media: {
    imagePath: generation.versions[0].imagePath,
    thumbPath: generation.versions[0].thumbPath,
    aspect: '1:1',
  },
});

// Counters automatically updated:
// - user.counters.posts++
// - tribe.stats.posts++
```

### Add Respect

```typescript
import { addRespectWithCounters } from './utils/transactions';

await addRespectWithCounters(post._id, user._id);

// Counters automatically updated:
// - post.counts.respects++
// - postOwner.counters.respectsReceived++
```

### Query Feed

```typescript
import { Post } from './models';

const feed = await Post.findFeedByTribe(
  userTribeId,
  20,  // limit
  beforeDate  // cursor for pagination
);
```

---

## Performance Optimizations

### Feed Queries
- Single index query: `{ tribeId: 1, createdAt: -1 }`
- No joins at runtime (only populate)
- Denormalized counters (no aggregations)

### Transactions
- Only used for critical operations
- Kept as short as possible
- Proper error handling and rollback

### Indexes
- All critical queries have supporting indexes
- Compound indexes for common patterns
- TTL index for auto-cleanup

---

## Common Mistakes to Avoid

❌ Storing public URLs instead of GCS paths
❌ Overwriting generation versions
❌ Calculating feed counts on the fly
❌ Tying posts directly to files
❌ Allowing null tribeId after onboarding
❌ Forgetting transactions for counter updates
❌ Using hard deletes where soft deletes are needed

---

## Monitoring

### Health Check Endpoint

```bash
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "collections": {
      "users": 150,
      "posts": 1200,
      ...
    }
  }
}
```

### Logs

Winston logger configured with:
- Console output (development)
- File output (production)
- Error tracking
- Request logging

---

## Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Environment Checklist

- [ ] MongoDB connection string
- [ ] JWT secret (strong, random)
- [ ] GCS credentials
- [ ] Twilio credentials (if using)
- [ ] AI provider API keys
- [ ] Rate limiting configuration

---

## Authentication & Onboarding

### Twilio WhatsApp OTP

The API uses Twilio Verify for secure phone verification during onboarding.

**Quick Start:**

```bash
# Setup Twilio integration
npm run setup:twilio

# Create Verify Service
npm run twilio:create-service

# Test with your phone
npm run test:twilio +27821234567
```

**Features:**
- 📱 WhatsApp OTP verification
- 🛡️ Rate limiting (3 requests per 10 minutes)
- ⏱️ 10-minute code expiry
- 🔒 Secure session management
- 🧪 Development mode for testing

**Documentation:**
- [Twilio Setup Guide](../TWILIO_SETUP_GUIDE.md)
- [Quick Reference](TWILIO_QUICK_REFERENCE.md)

**Basic Usage:**

```typescript
import { sendWhatsAppOTP, verifyWhatsAppOTP } from './services/twilio.service';

// Send OTP
const result = await sendWhatsAppOTP('+27821234567');

// Verify OTP
const verified = await verifyWhatsAppOTP('+27821234567', '123456');
```

---

## AI Image Generation

### Gemini Nano Banana Pro

The API integrates Google's Gemini Nano Banana Pro for high-quality image generation.

**Quick Start:**

```bash
# Setup Gemini integration
npm run setup:gemini

# Test the integration
npm run test:gemini
```

**Features:**
- 🚀 Two models: Standard (fast) and Pro (high quality)
- 🎨 Face identity preservation with reference images
- 🛡️ Built-in safety and content moderation
- 🌍 Cultural respect and authenticity
- 📱 Support for 1:1 and 9:16 aspect ratios

**Documentation:**
- [Gemini Integration Guide](docs/GEMINI_INTEGRATION.md)
- [Usage Examples](examples/gemini-usage.ts)
- [Setup Guide](../GEMINI_SETUP_GUIDE.md)

**Basic Usage:**

```typescript
import { generateImage } from './services/gemini.service';

const result = await generateImage({
  prompt: 'Afrofuturist portrait with vibrant colors',
  quality: 'high', // or 'standard'
  aspectRatio: '1:1',
});

// result.imageData contains the PNG image
```

---

## Support

For detailed documentation, see:
- **Data Model**: `DATA_MODEL_IMPLEMENTATION.md`
- **Gemini Integration**: `docs/GEMINI_INTEGRATION.md`
- **Setup Guide**: `../GEMINI_SETUP_GUIDE.md`
- **API Endpoints**: `API_DOCUMENTATION.md` (coming soon)

---

## License

Proprietary - AfroMoji





